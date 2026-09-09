from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count
from django.conf import settings
from django.core.cache import cache
from .models import Customer, CustomerHistory, CustomerNote
from .serializers import (
    CustomerSerializer, CustomerListSerializer, CustomerHistorySerializer,
    CustomerNoteSerializer
)


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for Customer management."""

    queryset = Customer.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['customer_type', 'city', 'is_active']
    search_fields = ['name', 'email', 'phone', 'company_name']
    ordering_fields = ['name', 'total_purchases', 'outstanding_amount', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        return Customer.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        return CustomerSerializer
    
    def list(self, request, *args, **kwargs):
        # Only cache unfiltered list
        has_filters = any(request.query_params.get(key) for key in ['search', 'customer_type', 'city', 'is_active'])

        if not has_filters:
            cache_key = 'customers_list'
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data)

            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            cache.set(cache_key, serializer.data, settings.CACHE_TIMEOUTS.get('customers', 300))
            return Response(serializer.data)

        # For filtered/searched results, don't cache
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save()
        cache.delete('customers_list')

    def perform_update(self, serializer):
        serializer.save()
        cache.delete('customers_list')

    def perform_destroy(self, instance):
        instance.delete()
        cache.delete('customers_list')
    
    @action(detail=False, methods=['get'])
    def with_outstanding(self, request):
        """Get customers with outstanding amounts."""
        customers = self.queryset.filter(outstanding_amount__gt=0)
        serializer = CustomerListSerializer(customers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def top_customers(self, request):
        """Get top customers by purchase amount."""
        limit = int(request.query_params.get('limit', 10))
        customers = self.queryset.filter(is_active=True).order_by('-total_purchases')[:limit]
        serializer = CustomerListSerializer(customers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def purchase_history(self, request, pk=None):
        """Get customer's purchase history."""
        customer = self.get_object()
        from sales.models import Invoice
        from sales.serializers import InvoiceListSerializer
        
        invoices = Invoice.objects.filter(customer=customer).order_by('-created_at')[:50]
        serializer = InvoiceListSerializer(invoices, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add a note to a customer."""
        customer = self.get_object()
        serializer = CustomerNoteSerializer(data={**request.data, 'customer': customer.id})
        
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def update_stats(self, request, pk=None):
        """Manually update customer statistics."""
        customer = self.get_object()
        customer.update_stats()
        return Response(CustomerSerializer(customer).data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get customer statistics."""
        queryset = self.queryset
        
        stats = {
            'total_customers': queryset.count(),
            'active_customers': queryset.filter(is_active=True).count(),
            'total_outstanding': queryset.aggregate(total=Sum('outstanding_amount'))['total'] or 0,
            'total_revenue': queryset.aggregate(total=Sum('total_purchases'))['total'] or 0,
            'by_type': {
                ctype[0]: queryset.filter(customer_type=ctype[0]).count()
                for ctype in Customer.CUSTOMER_TYPE_CHOICES
            }
        }
        
        return Response(stats)


class CustomerHistoryViewSet(viewsets.ModelViewSet):
    """ViewSet for CustomerHistory management."""
    
    queryset = CustomerHistory.objects.select_related('customer', 'created_by').all()
    serializer_class = CustomerHistorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['customer', 'interaction_type']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CustomerNoteViewSet(viewsets.ModelViewSet):
    """ViewSet for CustomerNote management."""
    
    queryset = CustomerNote.objects.select_related('customer', 'created_by').all()
    serializer_class = CustomerNoteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['customer', 'is_important']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
