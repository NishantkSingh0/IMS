import re
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


def normalize_invoice_number(value):
    """Normalize a supplier invoice number for duplicate detection (case/space-insensitive)."""
    return re.sub(r'\s+', '', value or '').upper()


class ImmutableModel(models.Model):
    """Records that can be created once and never edited or deleted after submission."""

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValidationError(f'{self._meta.verbose_name} cannot be edited after submission.')
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError(f'{self._meta.verbose_name} cannot be deleted after submission.')


class PurchaseInvoice(ImmutableModel):
    """Inward record of a supplier (vendor) purchase invoice."""

    inward_number = models.CharField(max_length=50, unique=True, editable=False)

    # Vendor (with snapshot of details at time of entry)
    supplier = models.ForeignKey('inventory.Supplier', on_delete=models.PROTECT, related_name='purchase_invoices')
    supplier_name = models.CharField(max_length=200)
    supplier_gstin = models.CharField(max_length=20, blank=True)

    # Supplier's invoice details
    supplier_invoice_number = models.CharField(max_length=100)
    supplier_invoice_number_normalized = models.CharField(max_length=100, editable=False)
    supplier_invoice_date = models.DateField()
    po_number = models.CharField(max_length=100, blank=True)

    # Amounts
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    round_off = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    freight_charges = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='purchase_invoices')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Inward'
        verbose_name_plural = 'Inwards'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['supplier', 'supplier_invoice_number_normalized'],
                name='unique_supplier_invoice_number',
            ),
        ]

    def __str__(self):
        return f"Inward #{self.inward_number} ({self.supplier_invoice_number})"

    def save(self, *args, **kwargs):
        if not self.inward_number:
            self.inward_number = f"IN-{uuid.uuid4().hex[:8].upper()}"
        self.supplier_invoice_number_normalized = normalize_invoice_number(self.supplier_invoice_number)
        super().save(*args, **kwargs)


class PurchaseItem(ImmutableModel):
    """Line item of an inward invoice."""

    purchase = models.ForeignKey(PurchaseInvoice, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('inventory.Product', on_delete=models.PROTECT, related_name='purchase_items')

    # Snapshot of product info at time of inward
    product_name = models.CharField(max_length=200)
    product_sku = models.CharField(max_length=50)
    hsn_code = models.CharField(max_length=20, blank=True)
    unit = models.CharField(max_length=10)
    category_name = models.CharField(max_length=100, blank=True)

    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    # True when the invoiced rate differed from the selected product, so stock went to a "(price change)" item
    is_price_change = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Inward Item'
        verbose_name_plural = 'Inward Items'
        ordering = ['id']

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
