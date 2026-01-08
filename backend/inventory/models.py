from django.db import models
from django.conf import settings
import uuid


class Category(models.Model):
    """Product category model."""
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @property
    def product_count(self):
        return self.products.count()


class Supplier(models.Model):
    """Supplier/Vendor model."""
    
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=15)
    alternate_phone = models.CharField(max_length=15, blank=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    gst_number = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Supplier'
        verbose_name_plural = 'Suppliers'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """Product model."""
    
    UNIT_CHOICES = [
        ('pcs', 'Pieces'),
        ('kg', 'Kilograms'),
        ('g', 'Grams'),
        ('l', 'Liters'),
        ('ml', 'Milliliters'),
        ('m', 'Meters'),
        ('box', 'Box'),
        ('pack', 'Pack'),
        ('dozen', 'Dozen'),
    ]
    
    sku = models.CharField(max_length=50, unique=True)
    barcode = models.CharField(max_length=100, blank=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    
    # Pricing
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Stock
    current_stock = models.IntegerField(default=0)
    min_stock_level = models.IntegerField(default=10)
    max_stock_level = models.IntegerField(default=1000)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='pcs')
    
    # Tax
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    hsn_code = models.CharField(max_length=20, blank=True)
    
    # Media
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.sku})"
    
    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = f"SKU-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    
    @property
    def is_low_stock(self):
        return self.current_stock <= self.min_stock_level
    
    @property
    def profit_margin(self):
        if self.cost_price > 0:
            return ((self.selling_price - self.cost_price) / self.cost_price) * 100
        return 0
    
    @property
    def stock_value(self):
        return self.current_stock * self.cost_price


class StockTransaction(models.Model):
    """Stock movement/transaction model."""
    
    TRANSACTION_TYPES = [
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
        ('adjustment', 'Adjustment'),
        ('return', 'Return'),
        ('damage', 'Damage'),
        ('sale', 'Sale'),
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.IntegerField()
    previous_stock = models.IntegerField()
    new_stock = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    reference = models.CharField(max_length=100, blank=True)  # Invoice number, PO number, etc.
    notes = models.TextField(blank=True)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Stock Transaction'
        verbose_name_plural = 'Stock Transactions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.product.name} - {self.transaction_type} - {self.quantity}"


class LowStockAlert(models.Model):
    """Low stock alert model."""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='low_stock_alerts')
    current_stock = models.IntegerField()
    min_stock_level = models.IntegerField()
    is_acknowledged = models.BooleanField(default=False)
    acknowledged_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    acknowledged_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Low Stock Alert'
        verbose_name_plural = 'Low Stock Alerts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Low Stock: {self.product.name} ({self.current_stock})"
