from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, F, Count
from django.utils import timezone
from .models import Category, Supplier, Product, StockTransaction, LowStockAlert
from .serializers import (
    CategorySerializer, SupplierSerializer, SupplierListSerializer,
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
    
    def get_queryset(self):
        return Category.objects.annotate(product_count=Count('products'))
    
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
    
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get all products from a supplier."""
        supplier = self.get_object()
        products = supplier.products.filter(is_active=True)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for Product management."""
    
    queryset = Product.objects.select_related('category', 'supplier').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'supplier', 'is_active', 'unit']
    search_fields = ['name', 'sku', 'barcode', 'description']
    ordering_fields = ['name', 'selling_price', 'current_stock', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
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
    def search_barcode(self, request):
        """Search product by barcode."""
        barcode = request.query_params.get('barcode', '')
        if not barcode:
            return Response({'error': 'Barcode is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = self.queryset.get(barcode=barcode, is_active=True)
            serializer = ProductSerializer(product)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get inventory statistics."""
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
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge a low stock alert."""
        alert = self.get_object()
        alert.is_acknowledged = True
        alert.acknowledged_by = request.user
        alert.acknowledged_at = timezone.now()
        alert.save()
        return Response(self.get_serializer(alert).data)
    
    @action(detail=False, methods=['get'])
    def unacknowledged(self, request):
        """Get all unacknowledged alerts."""
        alerts = self.queryset.filter(is_acknowledged=False)
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)
