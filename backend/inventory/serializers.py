from rest_framework import serializers
from decimal import Decimal
from .models import Category, Supplier, Department, Product, StockTransaction, LowStockAlert


class CaseInsensitiveChoiceField(serializers.ChoiceField):
    """Choice field that normalizes input to lowercase before validation."""
    
    def to_internal_value(self, data):
        if data is None:
            return None
        # Normalize to lowercase before validation
        data = str(data).lower()
        return super().to_internal_value(data)


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""

    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'image', 'is_active', 'product_count', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Category name is required")
        if len(value) > 100:
            raise serializers.ValidationError("Category name cannot exceed 100 characters")
        return value.strip()


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for Supplier model."""

    class Meta:
        model = Supplier
        fields = '__all__'

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Supplier name is required")
        if len(value) > 200:
            raise serializers.ValidationError("Supplier name cannot exceed 200 characters")
        existing = Supplier.objects.filter(name__iexact=value.strip())
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("Supplier with this name already exists.")
        return value.strip()

    def validate_phone(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Phone number is required")
        if len(value) > 15:
            raise serializers.ValidationError("Phone number cannot exceed 15 characters")
        return value.strip()

    def validate_email(self, value):
        if value and '@' not in value:
            raise serializers.ValidationError("Invalid email format")
        return value

    def validate_pincode(self, value):
        if value and (len(value) < 6 or len(value) > 10):
            raise serializers.ValidationError("Pincode must be between 6 and 10 characters")
        return value


class SupplierListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for supplier lists."""
    
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'phone', 'city', 'state', 'address', 'gst_number', 'is_active']


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for factory departments with enhanced security."""

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Department name is required")
        if len(value) > 150:
            raise serializers.ValidationError("Department name cannot exceed 150 characters")
        # Check for duplicate names (case-insensitive)
        from .models import Department
        if self.instance:
            # Update case - exclude current instance
            if Department.objects.filter(name__iexact=value.strip()).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("Department with this name already exists.")
        else:
            # Create case
            if Department.objects.filter(name__iexact=value.strip()).exists():
                raise serializers.ValidationError("Department with this name already exists.")
        return value.strip()

    def validate_code(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Department code is required")
        if len(value) > 30:
            raise serializers.ValidationError("Department code cannot exceed 30 characters")
        # Check for duplicate codes (case-insensitive)
        from .models import Department
        if self.instance:
            # Update case - exclude current instance
            if Department.objects.filter(code__iexact=value.strip()).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("Department with this code already exists.")
        else:
            # Create case
            if Department.objects.filter(code__iexact=value.strip()).exists():
                raise serializers.ValidationError("Department with this code already exists.")
        return value.strip()


class DepartmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for department selectors."""

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'description', 'is_active']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model."""

    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    stock_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    # Override unit field to handle case-insensitive validation
    unit = CaseInsensitiveChoiceField(
        choices=Product.UNIT_CHOICES,
        required=True
    )

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'name', 'tally_name', 'description',
            'category', 'category_name',
            'cost_price', 'wastage_percent',
            'current_stock', 'min_stock_level', 'unit',
            'gst_rate', 'hsn_code', 'parent_product',
            'is_low_stock', 'stock_value', 'last_movement_at',
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'sku': {'required': False, 'allow_blank': True},
            'parent_product': {'read_only': True},
            'last_movement_at': {'read_only': True},
        }

    # Shown disabled in the edit form; the API enforces the same restriction
    LOCKED_ON_UPDATE = ('name', 'sku', 'unit', 'cost_price', 'gst_rate', 'current_stock')
    # Owners/managers may silently correct these directly (no stock movement/history recorded)
    MANAGER_EDITABLE = ('unit', 'cost_price', 'gst_rate', 'current_stock')

    def update(self, instance, validated_data):
        request = self.context.get('request')
        can_adjust = getattr(getattr(request, 'user', None), 'role', None) in ('owner', 'manager')
        for field in self.LOCKED_ON_UPDATE:
            if can_adjust and field in self.MANAGER_EDITABLE:
                continue
            incoming = validated_data.pop(field, None)
            if incoming is not None and incoming != getattr(instance, field):
                raise serializers.ValidationError({
                    field: [f"{field.replace('_', ' ')} cannot be changed once the product exists."]
                })
        return super().update(instance, validated_data)

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Product name is required")
        if len(value) > 200:
            raise serializers.ValidationError("Product name cannot exceed 200 characters")
        return value.strip()

    def validate_cost_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Cost price must be greater than 0")
        if value > 1000000:
            raise serializers.ValidationError("Cost price is too high")
        return value

    def validate_gst_rate(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("GST rate must be between 0 and 100")
        return value

    def validate(self, data):
        min_stock = data.get('min_stock_level')

        if min_stock is not None and min_stock < 0:
            raise serializers.ValidationError("Minimum stock level cannot be negative")

        current_stock = data.get('current_stock')
        if current_stock is not None and current_stock < 0:
            raise serializers.ValidationError({'current_stock': ["Current stock cannot be negative"]})

        return data


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product lists."""

    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'name', 'tally_name', 'category', 'category_name',
            'cost_price', 'wastage_percent', 'current_stock', 'min_stock_level', 'unit', 'gst_rate', 'hsn_code',
            'parent_product', 'is_low_stock', 'last_movement_at'
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


class StockHistorySerializer(serializers.ModelSerializer):
    """Inward (+) / outward (-) movement of a product with the linked document details."""

    movement = serializers.SerializerMethodField()
    change = serializers.SerializerMethodField()
    stock_before = serializers.DecimalField(source='previous_stock', max_digits=10, decimal_places=2, read_only=True)
    stock_after = serializers.DecimalField(source='new_stock', max_digits=10, decimal_places=2, read_only=True)
    inward_number = serializers.CharField(source='purchase.inward_number', default='', read_only=True)
    vendor_invoice_number = serializers.CharField(source='purchase.supplier_invoice_number', default='', read_only=True)
    vendor_name = serializers.CharField(source='purchase.supplier_name', default='', read_only=True)
    po_number = serializers.CharField(source='purchase.po_number', default='', read_only=True)
    slip_number = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='outward.department.name', default='', read_only=True)
    project_name = serializers.CharField(source='outward.project_name', default='', read_only=True)
    recorded_by = serializers.SerializerMethodField()

    class Meta:
        model = StockTransaction
        fields = [
            'id', 'created_at', 'movement', 'change', 'stock_before', 'stock_after', 'unit_price',
            'inward_number', 'vendor_invoice_number', 'vendor_name', 'po_number',
            'slip_number', 'department_name', 'project_name', 'recorded_by',
        ]

    def get_movement(self, obj):
        return 'inward' if obj.transaction_type == 'in' else 'outward'

    def get_change(self, obj):
        return str(obj.quantity if obj.transaction_type == 'in' else -obj.quantity)

    def get_slip_number(self, obj):
        if obj.transaction_type != 'sale':
            return ''
        return obj.outward.invoice_number if obj.outward else obj.reference

    def get_recorded_by(self, obj):
        return obj.performed_by.get_full_name() if obj.performed_by else ''


class StockAdjustmentSerializer(serializers.Serializer):
    """Serializer for stock adjustment."""
    
    product_id = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
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
    low_stock_count = serializers.IntegerField()
    out_of_stock_count = serializers.IntegerField()
    total_stock_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_categories = serializers.IntegerField()
    total_suppliers = serializers.IntegerField()
