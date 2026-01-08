from rest_framework import serializers
from .models import Customer, CustomerHistory, CustomerNote


class CustomerNoteSerializer(serializers.ModelSerializer):
    """Serializer for CustomerNote model."""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = CustomerNote
        fields = [
            'id', 'customer', 'note', 'is_important',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class CustomerHistorySerializer(serializers.ModelSerializer):
    """Serializer for CustomerHistory model."""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = CustomerHistory
        fields = [
            'id', 'customer', 'interaction_type', 'description',
            'amount', 'reference', 'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['created_by', 'created_at']


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model."""
    
    recent_history = CustomerHistorySerializer(source='history', many=True, read_only=True)
    notes = CustomerNoteSerializer(source='customer_notes', many=True, read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'alternate_phone',
            'address', 'city', 'state', 'pincode',
            'customer_type', 'company_name', 'gst_number',
            'credit_limit', 'outstanding_amount',
            'total_purchases', 'total_orders',
            'notes', 'is_active', 'created_at', 'updated_at',
            'recent_history'
        ]
        read_only_fields = ['outstanding_amount', 'total_purchases', 'total_orders', 'created_at', 'updated_at']


class CustomerListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for customer lists."""
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'phone', 'email', 'customer_type',
            'outstanding_amount', 'total_purchases', 'is_active'
        ]


class CustomerStatsSerializer(serializers.Serializer):
    """Serializer for customer statistics."""
    
    total_customers = serializers.IntegerField()
    active_customers = serializers.IntegerField()
    total_outstanding = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    by_type = serializers.DictField()
