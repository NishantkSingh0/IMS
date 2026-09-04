from rest_framework import serializers
from .models import Category, Supplier, Department, Product, StockTransaction, LowStockAlert


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    
    product_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'image', 'is_active', 'product_count', 'created_at', 'updated_at']


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for Supplier model."""
    
    class Meta:
        model = Supplier
        fields = '__all__'


class SupplierListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for supplier lists."""
    
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'phone', 'city', 'is_active']


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for factory departments."""

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'description', 'is_active', 'created_at', 'updated_at']


class DepartmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for department selectors."""

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'description', 'is_active']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    profit_margin = serializers.FloatField(read_only=True)
    stock_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'barcode', 'name', 'description',
            'category', 'category_name', 'supplier', 'supplier_name',
            'cost_price', 'selling_price', 'mrp',
            'current_stock', 'min_stock_level', 'max_stock_level', 'unit',
            'gst_rate', 'hsn_code', 'image', 'is_active',
            'is_low_stock', 'profit_margin', 'stock_value',
            'created_at', 'updated_at'
        ]


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product lists."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'barcode', 'name', 'category', 'category_name',
            'selling_price', 'current_stock', 'unit', 'is_low_stock', 'is_active', 'image'
        ]


class StockTransactionSerializer(serializers.ModelSerializer):
    """Serializer for StockTransaction model."""
    
    product_name = serializers.CharField(source='product.name', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    
    class Meta:
        model = StockTransaction
        fields = [
            'id', 'product', 'product_name', 'transaction_type',
            'quantity', 'previous_stock', 'new_stock', 'unit_price',
            'reference', 'notes', 'performed_by', 'performed_by_name', 'created_at'
        ]
        read_only_fields = ['previous_stock', 'new_stock', 'performed_by']


class StockAdjustmentSerializer(serializers.Serializer):
    """Serializer for stock adjustment."""
    
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField()
    transaction_type = serializers.ChoiceField(choices=['in', 'out', 'adjustment', 'damage', 'return'])
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    reference = serializers.CharField(max_length=100, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class LowStockAlertSerializer(serializers.ModelSerializer):
    """Serializer for LowStockAlert model."""
    
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = LowStockAlert
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'current_stock', 'min_stock_level', 'is_acknowledged',
            'acknowledged_by', 'acknowledged_at', 'created_at'
        ]


class InventoryStatsSerializer(serializers.Serializer):
    """Serializer for inventory statistics."""
    
    total_products = serializers.IntegerField()
    active_products = serializers.IntegerField()
    low_stock_count = serializers.IntegerField()
    out_of_stock_count = serializers.IntegerField()
    total_stock_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_categories = serializers.IntegerField()
    total_suppliers = serializers.IntegerField()
