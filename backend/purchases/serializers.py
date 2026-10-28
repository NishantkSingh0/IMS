from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from inventory.models import Category, Product, Supplier
from inventory.serializers import CaseInsensitiveChoiceField
from .models import PurchaseInvoice, PurchaseItem
from .services import create_purchase_invoice, find_duplicate_invoice


class PurchaseItemSerializer(serializers.ModelSerializer):
    """Read serializer for inward line items."""

    class Meta:
        model = PurchaseItem
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'hsn_code', 'unit', 'category_name',
            'quantity', 'unit_price', 'tax_rate', 'tax_amount', 'total', 'is_price_change'
        ]
        read_only_fields = fields


class PurchaseInvoiceSerializer(serializers.ModelSerializer):
    """Detail serializer for inwards."""

    items = PurchaseItemSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = PurchaseInvoice
        fields = [
            'id', 'inward_number', 'supplier', 'supplier_name', 'supplier_gstin',
            'supplier_invoice_number', 'supplier_invoice_date', 'po_number',
            'subtotal', 'tax_amount', 'round_off', 'freight_charges', 'total_amount', 'notes',
            'created_by', 'created_by_name', 'created_at', 'items'
        ]
        read_only_fields = fields


class PurchaseInvoiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for inward lists."""

    item_count = serializers.IntegerField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = PurchaseInvoice
        fields = [
            'id', 'inward_number', 'supplier', 'supplier_name', 'supplier_gstin',
            'supplier_invoice_number', 'supplier_invoice_date', 'po_number',
            'total_amount', 'item_count', 'created_by_name', 'created_at'
        ]
        read_only_fields = fields


class NewProductSerializer(serializers.Serializer):
    """Product that does not exist yet and is created by this inward."""

    name = serializers.CharField(max_length=200)
    unit = CaseInsensitiveChoiceField(choices=Product.UNIT_CHOICES)
    hsn_code = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    gst_rate = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=Decimal('0'), max_value=Decimal('100'))
    # Required for every new product (it is saved to the product for outward pricing)
    wastage_percent = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=Decimal('0'), max_value=Decimal('100'))
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(is_active=True),
        error_messages={'required': 'Select a category for the new product.', 'null': 'Select a category for the new product.'},
    )

    def validate_name(self, value):
        value = ' '.join(value.split())
        if not value:
            raise serializers.ValidationError("Product name is required")
        if Product.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError(
                f'"{value}" already exists. Select it from the product suggestions instead.'
            )
        return value


class PurchaseItemCreateSerializer(serializers.Serializer):
    """Line item input: an existing product (product_id) or a new product (new_product)."""

    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product', required=False)
    new_product = NewProductSerializer(required=False)
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'), max_value=Decimal('1000000'))
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'), max_value=Decimal('10000000'))
    tax_rate = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=Decimal('0'), max_value=Decimal('100'), required=False)
    # Only used for an existing product that has no category yet; it is saved to the product
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(is_active=True), source='category', required=False, allow_null=True
    )
    # Only used for an existing product that has no wastage % yet; it is saved to the product
    wastage_percent = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=Decimal('0'), max_value=Decimal('100'), required=False)

    def validate(self, data):
        product = data.get('product')
        if bool(product) == bool(data.get('new_product')):
            raise serializers.ValidationError("Provide either an existing product or a new product for each item.")
        if product:
            if not product.category_id and not data.get('category'):
                raise serializers.ValidationError({'category_id': [f'Select a category for "{product.name}".']})
            if product.wastage_percent is None and data.get('wastage_percent') is None:
                raise serializers.ValidationError({'wastage_percent': [f'Set the wastage % for "{product.name}".']})
        return data


class PurchaseInvoiceCreateSerializer(serializers.Serializer):
    """Input serializer for submitting an inward invoice."""

    supplier_id = serializers.PrimaryKeyRelatedField(queryset=Supplier.objects.filter(is_active=True), source='supplier')
    supplier_invoice_number = serializers.CharField(max_length=100)
    supplier_invoice_date = serializers.DateField()
    po_number = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    round_off = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=Decimal('-10'), max_value=Decimal('10'), default=Decimal('0'))
    freight_charges = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=Decimal('0'), max_value=Decimal('1000000'), default=Decimal('0'))
    notes = serializers.CharField(max_length=1000, required=False, allow_blank=True, default='')
    items = PurchaseItemCreateSerializer(many=True)

    def validate_supplier_invoice_number(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Invoice number is required")
        return value

    def validate_supplier_invoice_date(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("Invoice date cannot be in the future")
        return value

    def validate_po_number(self, value):
        return value.strip()

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required")
        if len(value) > 200:
            raise serializers.ValidationError("Cannot add more than 200 items in a single inward")
        new_names = [i['new_product']['name'].lower() for i in value if i.get('new_product')]
        if len(new_names) != len(set(new_names)):
            raise serializers.ValidationError("The same new product is added more than once")
        return value

    def validate(self, data):
        duplicate = find_duplicate_invoice(data['supplier'].pk, data['supplier_invoice_number'])
        if duplicate:
            raise serializers.ValidationError({
                'supplier_invoice_number': [
                    f"Invoice {duplicate.supplier_invoice_number} from {duplicate.supplier_name} "
                    f"is already recorded as {duplicate.inward_number}."
                ]
            })
        return data

    def create(self, validated_data):
        return create_purchase_invoice(self.context['request'].user, validated_data)
