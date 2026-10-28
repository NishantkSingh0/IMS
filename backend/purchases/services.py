from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework import serializers

from inventory.models import Product, StockTransaction
from .models import PurchaseInvoice, PurchaseItem, normalize_invoice_number

PRICE_CHANGE_SUFFIX = ' (price change)'
TWO_PLACES = Decimal('0.01')


def money(value):
    return Decimal(value).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def find_duplicate_invoice(supplier_id, invoice_number):
    return PurchaseInvoice.objects.filter(
        supplier_id=supplier_id,
        supplier_invoice_number_normalized=normalize_invoice_number(invoice_number),
    ).first()


def _lock_products(product_ids):
    """Lock products and their original (parent) products in a stable order to serialize stock updates."""
    parent_ids = Product.objects.filter(pk__in=product_ids, parent_product__isnull=False).values_list('parent_product_id', flat=True)
    ids = set(product_ids) | set(parent_ids)
    return {p.pk: p for p in Product.objects.select_for_update().filter(pk__in=ids).order_by('pk')}


def _resolve_stock_product(selected, unit_price, tax_rate, locked):
    """
    Return the product that should receive the stock.

    Same rate as selected product -> selected product.
    Different rate -> an existing item of the same family at that rate, or a new "<name> (price change)" item.
    The original product's price and stock are never modified.
    """
    if selected.cost_price == unit_price:
        return selected, False

    base = locked.get(selected.parent_product_id) if selected.parent_product_id else selected
    match = (
        Product.objects.select_for_update()
        .filter(Q(pk=base.pk) | Q(parent_product=base), cost_price=unit_price)
        .order_by('pk')
        .first()
    )
    if match:
        locked.setdefault(match.pk, match)
        return locked[match.pk], True

    variant = Product.objects.create(
        name=f"{base.name[:200 - len(PRICE_CHANGE_SUFFIX)]}{PRICE_CHANGE_SUFFIX}",
        tally_name=base.tally_name,
        description=base.description,
        category=base.category,
        parent_product=base,
        cost_price=unit_price,
        current_stock=0,
        min_stock_level=base.min_stock_level,
        unit=base.unit,
        gst_rate=tax_rate,
        hsn_code=base.hsn_code,
        wastage_percent=base.wastage_percent,
    )
    locked[variant.pk] = variant
    return variant, True


def _fill_missing_category(selected, category, locked):
    """Save the chosen category on a product (and its original) that has none yet. Existing categories are never changed."""
    if not category:
        return
    base = locked.get(selected.parent_product_id)
    for product in filter(None, [selected, base]):
        if not product.category_id:
            product.category = category
            product.save(update_fields=['category', 'updated_at'])


def _create_new_product(data, unit_price):
    return Product.objects.create(
        name=data['name'],
        category=data.get('category'),
        unit=data['unit'],
        hsn_code=data.get('hsn_code', ''),
        gst_rate=data['gst_rate'],
        wastage_percent=data['wastage_percent'],
        cost_price=unit_price,
        current_stock=0,
    )


def _invalidate_caches():
    cache.delete_many(['products_list_page1', 'inventory_stats', 'categories_list'])


@transaction.atomic
def create_purchase_invoice(user, data):
    """Record an inward invoice: create items, route price changes, increase stock and log transactions."""
    supplier = data['supplier']
    items_data = data['items']

    locked = _lock_products([i['product'].pk for i in items_data if i.get('product')])

    # Resolve the product receiving stock for every line before writing anything
    lines = []
    for item in items_data:
        unit_price = item['unit_price']
        if item.get('product'):
            selected = locked[item['product'].pk]
            _fill_missing_category(selected, item.get('category'), locked)
            # First inward of this product: capture its wastage % once (saved to the product)
            if selected.wastage_percent is None and item.get('wastage_percent') is not None:
                selected.wastage_percent = item['wastage_percent']
                selected.save(update_fields=['wastage_percent', 'updated_at'])
            tax_rate = item.get('tax_rate', selected.gst_rate)
            product, is_price_change = _resolve_stock_product(selected, unit_price, tax_rate, locked)
        else:
            tax_rate = item.get('tax_rate', item['new_product']['gst_rate'])
            product, is_price_change = _create_new_product(item['new_product'], unit_price), False
            locked[product.pk] = product

        quantity = item['quantity']
        total = money(quantity * unit_price)
        lines.append({
            'product': product,
            'quantity': quantity,
            'unit_price': unit_price,
            'tax_rate': tax_rate,
            'total': total,
            'tax_amount': money(total * tax_rate / 100),
            'is_price_change': is_price_change,
        })

    # GST is calculated per tax-rate group, as on a GST invoice
    taxable_by_rate = defaultdict(Decimal)
    for line in lines:
        taxable_by_rate[line['tax_rate']] += line['total']
    subtotal = money(sum(taxable_by_rate.values()))
    tax_amount = money(sum(money(amount * rate / 100) for rate, amount in taxable_by_rate.items()))
    round_off = data.get('round_off', Decimal('0'))
    freight = data.get('freight_charges', Decimal('0'))

    try:
        with transaction.atomic():
            purchase = PurchaseInvoice.objects.create(
                supplier=supplier,
                supplier_name=supplier.name,
                supplier_gstin=supplier.gst_number,
                supplier_invoice_number=data['supplier_invoice_number'],
                supplier_invoice_date=data['supplier_invoice_date'],
                po_number=data.get('po_number', ''),
                subtotal=subtotal,
                tax_amount=tax_amount,
                round_off=round_off,
                freight_charges=freight,
                total_amount=subtotal + tax_amount + round_off + freight,
                notes=data.get('notes', ''),
                created_by=user,
            )
    except IntegrityError:
        raise serializers.ValidationError({
            'supplier_invoice_number': ['This invoice number is already recorded for this vendor.']
        })

    reference = f"{purchase.inward_number} | {purchase.supplier_invoice_number}"[:100]
    for line in lines:
        product = line['product']
        PurchaseItem.objects.create(
            purchase=purchase,
            product=product,
            product_name=product.name,
            product_sku=product.sku,
            hsn_code=product.hsn_code,
            unit=product.unit,
            category_name=product.category.name if product.category else '',
            quantity=line['quantity'],
            unit_price=line['unit_price'],
            tax_rate=line['tax_rate'],
            tax_amount=line['tax_amount'],
            total=line['total'],
            is_price_change=line['is_price_change'],
        )

        previous_stock = product.current_stock
        product.current_stock = previous_stock + line['quantity']
        product.last_movement_at = purchase.created_at
        product.save(update_fields=['current_stock', 'last_movement_at', 'updated_at'])

        StockTransaction.objects.create(
            product=product,
            transaction_type='in',
            quantity=line['quantity'],
            previous_stock=previous_stock,
            new_stock=product.current_stock,
            unit_price=line['unit_price'],
            reference=reference,
            notes=f"Inward from {supplier.name}",
            purchase=purchase,
            performed_by=user,
        )

    transaction.on_commit(_invalidate_caches)
    return purchase
