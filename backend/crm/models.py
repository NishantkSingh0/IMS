from django.db import models
from django.conf import settings


class Customer(models.Model):
    """Customer model."""
    
    CUSTOMER_TYPE_CHOICES = [
        ('retail', 'Retail Customer'),
        ('wholesale', 'Wholesale Customer'),
        ('corporate', 'Corporate Client'),
    ]
    
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=15)
    alternate_phone = models.CharField(max_length=15, blank=True)
    
    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    
    # Business details
    customer_type = models.CharField(max_length=20, choices=CUSTOMER_TYPE_CHOICES, default='retail')
    company_name = models.CharField(max_length=200, blank=True)
    gst_number = models.CharField(max_length=20, blank=True)
    
    # Credit
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Stats (cached)
    total_purchases = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_orders = models.IntegerField(default=0)
    
    # Notes
    notes = models.TextField(blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def update_stats(self):
        """Update cached statistics."""
        from sales.models import Invoice
        invoices = Invoice.objects.filter(
            customer=self,
            payment_status__in=['paid', 'partial']
        )
        self.total_purchases = invoices.aggregate(
            total=models.Sum('total_amount')
        )['total'] or 0
        self.total_orders = invoices.count()
        self.outstanding_amount = invoices.aggregate(
            total=models.Sum('due_amount')
        )['total'] or 0
        self.save()


class CustomerHistory(models.Model):
    """Customer interaction history."""
    
    INTERACTION_TYPES = [
        ('purchase', 'Purchase'),
        ('payment', 'Payment'),
        ('return', 'Return'),
        ('inquiry', 'Inquiry'),
        ('complaint', 'Complaint'),
        ('note', 'Note'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='history')
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPES)
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    reference = models.CharField(max_length=100, blank=True)  # Invoice number, etc.
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Customer History'
        verbose_name_plural = 'Customer Histories'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.customer.name} - {self.interaction_type} - {self.created_at}"


class CustomerNote(models.Model):
    """Notes about customers."""
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='customer_notes')
    note = models.TextField()
    is_important = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Customer Note'
        verbose_name_plural = 'Customer Notes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note for {self.customer.name}"
