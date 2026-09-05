from rest_framework import serializers
from django.db import transaction
from .models import Invoice, InvoiceItem, Payment, DailySales, Return
from inventory.models import Department, Product, StockTransaction


class InvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for InvoiceItem model."""
    
    class Meta:
        model = InvoiceItem
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'quantity', 'unit_price', 'discount', 'tax_rate',
            'tax_amount', 'total'
        ]
        read_only_fields = ['tax_amount', 'total']


class InvoiceItemCreateSerializer(serializers.Serializer):
    """Serializer for creating invoice items."""
    
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model."""
    
    received_by_name = serializers.CharField(source='received_by.get_full_name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'amount', 'payment_method',
            'reference', 'notes', 'received_by', 'received_by_name',
            'payment_date'
        ]
        read_only_fields = ['received_by', 'payment_date']


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model."""
    
    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name',
            'department', 'department_name', 'department_code',
            'project_name', 'project_created_by',
            'subtotal', 'discount_amount', 'discount_percentage',
            'tax_amount', 'total_amount', 'paid_amount', 'due_amount',
            'payment_status', 'payment_method', 'payment_reference',
            'invoice_date', 'due_date', 'notes',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'items', 'payments'
        ]
        read_only_fields = [
            'invoice_number', 'subtotal', 'tax_amount', 'total_amount',
            'due_amount', 'created_by', 'created_at', 'updated_at'
        ]


class InvoiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for invoice lists."""
    
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)
    item_count = serializers.IntegerField(source='items.count', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name',
            'department', 'department_name', 'department_code',
            'project_name', 'project_created_by',
            'total_amount', 'paid_amount', 'due_amount',
            'payment_status', 'payment_method', 'invoice_date',
            'item_count', 'created_at'
        ]


class InvoiceCreateSerializer(serializers.Serializer):
    """Serializer for creating a new invoice."""
    
    customer_id = serializers.IntegerField(required=False, allow_null=True)
    department_id = serializers.IntegerField()
    project_name = serializers.CharField(required=True)
    project_created_by = serializers.CharField(required=False, allow_blank=True)
    items = InvoiceItemCreateSerializer(many=True)
    discount_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, default=0)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required")
        return value

    def validate_department_id(self, value):
        if not Department.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Select an active department")
        return value

    def validate_project_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Project name is required")
        return value.strip()
    
    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        items_data = validated_data.pop('items')
        customer_id = validated_data.pop('customer_id', None)
        department_id = validated_data.pop('department_id')
        project_name = validated_data.pop('project_name')
        project_created_by = validated_data.pop('project_created_by', '')
        
        # Create invoice
        invoice = Invoice.objects.create(
            customer_id=customer_id,
            department_id=department_id,
            project_name=project_name,
            project_created_by=project_created_by,
            discount_percentage=validated_data.get('discount_percentage', 0),
            notes=validated_data.get('notes', ''),
            created_by=user
        )
        
        # Create invoice items and update stock
        for item_data in items_data:
            product = Product.objects.get(id=item_data['product_id'])
            
            # Check stock
            if product.current_stock < item_data['quantity']:
                raise serializers.ValidationError(
                    f"Insufficient stock for {product.name}. Available: {product.current_stock}"
                )
            
            # Create invoice item
            unit_price = item_data.get('unit_price', product.selling_price)
            InvoiceItem.objects.create(
                invoice=invoice,
                product=product,
                product_name=product.name,
                product_sku=product.sku,
                quantity=item_data['quantity'],
                unit_price=unit_price,
                discount=item_data.get('discount', 0),
                tax_rate=product.gst_rate
            )
            
            # Update stock
            previous_stock = product.current_stock
            product.current_stock -= item_data['quantity']
            product.save()
            
            # Create stock transaction
            StockTransaction.objects.create(
                product=product,
                transaction_type='sale',
                quantity=item_data['quantity'],
                previous_stock=previous_stock,
                new_stock=product.current_stock,
                unit_price=unit_price,
                reference=invoice.invoice_number,
                performed_by=user
            )
        
        # Calculate totals
        invoice.calculate_totals()
        invoice.paid_amount = invoice.total_amount
        invoice.due_amount = 0
        invoice.payment_status = 'paid'
        invoice.save()
        
        return invoice


class DailySalesSerializer(serializers.ModelSerializer):
    """Serializer for DailySales model."""
    
    class Meta:
        model = DailySales
        fields = '__all__'


class ReturnSerializer(serializers.ModelSerializer):
    """Serializer for Return model."""
    
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    product_name = serializers.CharField(source='invoice_item.product_name', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    
    class Meta:
        model = Return
        fields = [
            'id', 'return_number', 'invoice', 'invoice_number',
            'invoice_item', 'product_name', 'quantity', 'reason',
            'reason_detail', 'refund_amount', 'status',
            'processed_by', 'processed_by_name', 'created_at', 'processed_at'
        ]
        read_only_fields = ['return_number', 'processed_by', 'created_at', 'processed_at']


class SalesStatsSerializer(serializers.Serializer):
    """Serializer for sales statistics."""
    
    total_sales = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_invoices = serializers.IntegerField()
    total_items_sold = serializers.IntegerField()
    total_tax_collected = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_discounts = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_invoice_value = serializers.DecimalField(max_digits=12, decimal_places=2)
