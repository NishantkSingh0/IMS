from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, F
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache
from .models import Category, Supplier, Department, Product, StockTransaction, LowStockAlert
from .serializers import (
    CategorySerializer, SupplierSerializer, SupplierListSerializer,
    DepartmentSerializer, DepartmentListSerializer,
    ProductSerializer, ProductListSerializer, StockTransactionSerializer,
    StockAdjustmentSerializer, LowStockAlertSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Category management."""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def list(self, request, *args, **kwargs):
        # Cache the serialized response for list view
        cache_key = 'categories_list'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        cache.set(cache_key, serializer.data, settings.CACHE_TIMEOUTS.get('categories', 3600))
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save()
        # Invalidate cache on create
        cache.delete('categories_list')

    def perform_update(self, serializer):
        serializer.save()
        # Invalidate cache on update
        cache.delete('categories_list')

    def perform_destroy(self, instance):
        instance.delete()
        # Invalidate cache on delete
        cache.delete('categories_list')
    
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get all products in a category."""
        category = self.get_object()
        products = category.products.filter(is_active=True)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class SupplierViewSet(viewsets.ModelViewSet):
    """ViewSet for Supplier management."""

    queryset = Supplier.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['city', 'state', 'is_active']
    search_fields = ['name', 'contact_person', 'email', 'phone']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return SupplierListSerializer
        return SupplierSerializer

    def list(self, request, *args, **kwargs):
        cache_key = 'suppliers_list'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        cache.set(cache_key, serializer.data, settings.CACHE_TIMEOUTS.get('suppliers', 3600))
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save()
        cache.delete('suppliers_list')

    def perform_update(self, serializer):
        serializer.save()
        cache.delete('suppliers_list')

    def perform_destroy(self, instance):
        instance.delete()
        cache.delete('suppliers_list')
    
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get all products from a supplier."""
        supplier = self.get_object()
        products = supplier.products.filter(is_active=True)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class DepartmentViewSet(viewsets.ModelViewSet):
    """ViewSet for factory department management with JWT security."""

    queryset = Department.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return DepartmentListSerializer
        return DepartmentSerializer

    def get_permissions(self):
        """
        Custom permission handling:
        - All authenticated users can list and retrieve departments
        - Only managers and owners can create, update, delete departments
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            from staff.models import User
            if self.request.user.is_authenticated:
                if self.request.user.role in ['owner', 'manager']:
                    return [IsAuthenticated()]
            from rest_framework.permissions import IsAdminUser
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        # Cache the serialized response for list view
        cache_key = 'departments_list'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        cache.set(cache_key, serializer.data, settings.CACHE_TIMEOUTS.get('departments', 3600))
        return Response(serializer.data)

    def perform_create(self, serializer):
        # Add audit trail for department creation
        serializer.save()
        cache.delete('departments_list')
        self.log_activity('create', 'Department', serializer.instance.id, f"Created department: {serializer.instance.name}")

    def perform_update(self, serializer):
        # Add audit trail for department update
        serializer.save()
        cache.delete('departments_list')
        self.log_activity('update', 'Department', serializer.instance.id, f"Updated department: {serializer.instance.name}")

    def perform_destroy(self, instance):
        # Add audit trail for department deletion
        department_name = instance.name
        instance.delete()
        cache.delete('departments_list')
        self.log_activity('delete', 'Department', instance.id, f"Deleted department: {department_name}")

    def log_activity(self, action, model_name, object_id, description):
        """Log user activity for audit trail."""
        from staff.models import ActivityLog
        try:
            ActivityLog.objects.create(
                user=self.request.user,
                action=action,
                model_name=model_name,
                object_id=object_id,
                description=description,
                ip_address=self.get_client_ip(self.request),
                user_agent=self.request.META.get('HTTP_USER_AGENT', '')[:500]
            )
        except Exception:
            # Don't fail the main operation if logging fails
            pass

    def get_client_ip(self, request):
        """Get client IP address with proxy support."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for Product management."""

    queryset = Product.objects.select_related('category', 'supplier').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'supplier', 'is_active', 'unit']
    search_fields = ['name', 'tally_name', 'sku', 'description']
    ordering_fields = ['name', 'current_stock', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def list(self, request, *args, **kwargs):
        # Only cache unfiltered list (no search or filters applied)
        has_filters = any(request.query_params.get(key) for key in ['search', 'category', 'supplier', 'is_active', 'unit'])

        if not has_filters:
            cache_key = 'products_list'
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data)

            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            cache.set(cache_key, serializer.data, settings.CACHE_TIMEOUTS.get('products', 600))
            return Response(serializer.data)

        # For filtered/searched results, don't cache
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save()
        cache.delete('products_list')

    def perform_update(self, serializer):
        serializer.save()
        cache.delete('products_list')

    def perform_destroy(self, instance):
        instance.delete()
        cache.delete('products_list')
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get all low stock products."""
        products = self.queryset.filter(
            is_active=True,
            current_stock__lte=F('min_stock_level')
        )
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        """Get all out of stock products."""
        products = self.queryset.filter(is_active=True, current_stock=0)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get inventory statistics."""
        # Cache stats response
        cache_key = 'inventory_stats'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        queryset = self.queryset.filter(is_active=True)

        stats = {
            'total_products': Product.objects.count(),
            'active_products': queryset.count(),
            'low_stock_count': queryset.filter(current_stock__lte=F('min_stock_level')).count(),
            'out_of_stock_count': queryset.filter(current_stock=0).count(),
            'total_stock_value': queryset.aggregate(
                total=Sum(F('current_stock') * F('cost_price'))
            )['total'] or 0,
            'total_categories': Category.objects.filter(is_active=True).count(),
            'total_suppliers': Supplier.objects.filter(is_active=True).count(),
        }
        cache.set(cache_key, stats, settings.CACHE_TIMEOUTS.get('stats', 60))
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        """Adjust stock for a product."""
        product = self.get_object()
        serializer = StockAdjustmentSerializer(data={
            'product_id': product.id,
            **request.data
        })

        if serializer.is_valid():
            data = serializer.validated_data
            quantity = data['quantity']
            transaction_type = data['transaction_type']

            previous_stock = product.current_stock

            if transaction_type in ['in', 'return']:
                product.current_stock += quantity
            elif transaction_type in ['out', 'damage', 'sale']:
                if product.current_stock < quantity:
                    return Response(
                        {'error': 'Insufficient stock'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                product.current_stock -= quantity
            else:  # adjustment
                product.current_stock = quantity

            product.save()

            # Invalidate product and inventory stats caches
            cache.delete('products_list')
            cache.delete('inventory_stats')

            # Create stock transaction record
            StockTransaction.objects.create(
                product=product,
                transaction_type=transaction_type,
                quantity=quantity,
                previous_stock=previous_stock,
                new_stock=product.current_stock,
                unit_price=data.get('unit_price'),
                reference=data.get('reference', ''),
                notes=data.get('notes', ''),
                performed_by=request.user
            )

            # Create low stock alert if needed
            if product.is_low_stock:
                LowStockAlert.objects.get_or_create(
                    product=product,
                    is_acknowledged=False,
                    defaults={
                        'current_stock': product.current_stock,
                        'min_stock_level': product.min_stock_level
                    }
                )

            return Response(ProductSerializer(product).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for StockTransaction (read-only)."""
    
    queryset = StockTransaction.objects.select_related('product', 'performed_by').all()
    serializer_class = StockTransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['product', 'transaction_type', 'performed_by']
    search_fields = ['product__name', 'reference', 'notes']
    ordering = ['-created_at']
    
    @action(detail=False, methods=['get'])
    def by_product(self, request):
        """Get stock transactions for a specific product."""
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        transactions = self.queryset.filter(product_id=product_id)[:50]
        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)


class LowStockAlertViewSet(viewsets.ModelViewSet):
    """ViewSet for LowStockAlert management."""
    
    queryset = LowStockAlert.objects.select_related('product', 'acknowledged_by').all()
    serializer_class = LowStockAlertSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_acknowledged']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'])
    def unacknowledged(self, request):
        """Get unacknowledged low stock alerts."""
        alerts = self.queryset.filter(is_acknowledged=False)
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge a low stock alert."""
        alert = self.get_object()
        alert.is_acknowledged = True
        alert.acknowledged_by = request.user
        alert.acknowledged_at = timezone.now()
        alert.save()
        return Response(self.get_serializer(alert).data)
