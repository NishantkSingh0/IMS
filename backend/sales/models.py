from django.db import models
from django.conf import settings
from inventory.models import Product
import uuid


class Invoice(models.Model):
    """Invoice/Bill model."""

    invoice_number = models.CharField(max_length=50, unique=True)
    department = models.ForeignKey('inventory.Department', on_delete=models.PROTECT, null=True, blank=True, related_name='invoices')
    project_name = models.CharField(max_length=200, blank=True)
    project_created_by = models.CharField(max_length=200, blank=True)

    # Amounts
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Dates
    invoice_date = models.DateField(auto_now_add=True)

    # Notes
    notes = models.TextField(blank=True)

    # Staff
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_invoices')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice #{self.invoice_number}"
    
    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = f"SLIP-{uuid.uuid4().hex[:8].upper()}"

        super().save(*args, **kwargs)

    def calculate_totals(self):
        """Calculate invoice totals from items."""
        items = self.items.all()
        self.subtotal = sum(item.total for item in items)

        # Apply discount
        if self.discount_percentage > 0:
            self.discount_amount = self.subtotal * (self.discount_percentage / 100)

        # Calculate tax
        self.tax_amount = sum(item.tax_amount for item in items)

        # Calculate total
        self.total_amount = self.subtotal - self.discount_amount + self.tax_amount

        self.save()


class InvoiceItem(models.Model):
    """Invoice line item model."""
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    
    # Snapshot of product info at time of sale
    product_name = models.CharField(max_length=200)
    product_sku = models.CharField(max_length=50)
    
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    class Meta:
        verbose_name = 'Invoice Item'
        verbose_name_plural = 'Invoice Items'
    
    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
    
    def save(self, *args, **kwargs):
        # Calculate item total (without tax)
        self.total = (self.unit_price * self.quantity) - self.discount
        # Calculate tax amount separately
        self.tax_amount = self.total * (self.tax_rate / 100)
        super().save(*args, **kwargs)


class Payment(models.Model):
    """Payment record model."""

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    payment_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"Payment of {self.amount} for {self.invoice}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)


class DailySales(models.Model):
    """Daily sales summary model."""
    
    date = models.DateField(unique=True)
    total_invoices = models.IntegerField(default=0)
    total_sales = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_cash = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_card = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_upi = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_credit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Daily Sales'
        verbose_name_plural = 'Daily Sales'
        ordering = ['-date']
    
    def __str__(self):
        return f"Sales for {self.date}"


class Return(models.Model):
    """Sales return/refund model."""
    
    RETURN_REASONS = [
        ('defective', 'Defective Product'),
        ('wrong_item', 'Wrong Item'),
        ('not_needed', 'Not Needed'),
        ('quality', 'Quality Issue'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    
    return_number = models.CharField(max_length=50, unique=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='returns')
    invoice_item = models.ForeignKey(InvoiceItem, on_delete=models.CASCADE, related_name='returns')
    quantity = models.IntegerField()
    reason = models.CharField(max_length=20, choices=RETURN_REASONS)
    reason_detail = models.TextField(blank=True)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Return'
        verbose_name_plural = 'Returns'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Return #{self.return_number}"
    
    def save(self, *args, **kwargs):
        if not self.return_number:
            self.return_number = f"RET-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
