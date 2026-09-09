from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter, DateFilter
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache
from datetime import timedelta
from .models import Invoice, InvoiceItem, Payment, DailySales, Return
from .serializers import (
    InvoiceSerializer, InvoiceListSerializer, InvoiceCreateSerializer,
    InvoiceItemSerializer, PaymentSerializer, DailySalesSerializer,
    ReturnSerializer
)


class InvoiceFilter(FilterSet):
    project_name = CharFilter(field_name='project_name', lookup_expr='icontains')
    created_at_gte = DateFilter(field_name='created_at', lookup_expr='gte')
    created_at_lte = DateFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = Invoice
        fields = ['department', 'customer', 'created_by', 'project_name']


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for Invoice management."""

    queryset = Invoice.objects.select_related('customer', 'department', 'created_by').prefetch_related('items', 'payments').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = InvoiceFilter
    search_fields = ['invoice_number', 'department__name', 'department__code', 'project_name', 'notes']
    ordering_fields = ['created_at', 'total_amount', 'invoice_date']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer

    def list(self, request, *args, **kwargs):
        # Only cache unfiltered list (first page, no filters)
        has_filters = any(request.query_params.get(key) for key in ['search', 'department', 'customer', 'created_by', 'project_name', 'created_at_gte', 'created_at_lte'])
        page = request.query_params.get('page')

        if not has_filters and (not page or page == '1'):
            cache_key = 'invoices_list_page1'
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data)

            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                response_data = self.get_paginated_response(serializer.data).data
                cache.set(cache_key, response_data, 60)  # Cache for 1 minute only
                return Response(response_data)

            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        # For filtered/searched/paginated results, don't cache
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save()
        cache.delete('invoices_list_page1')
        # Invalidate all sales stats caches
        cache.delete_many([cache.make_key(k) for k in cache.keys('sales_stats_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('daily_summary_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('monthly_summary_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('top_products_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('by_payment_method_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('by_department_*') if cache.make_key(k)])

    def perform_update(self, serializer):
        serializer.save()
        cache.delete('invoices_list_page1')
        # Invalidate all sales stats caches
        cache.delete_many([cache.make_key(k) for k in cache.keys('sales_stats_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('daily_summary_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('monthly_summary_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('top_products_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('by_payment_method_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('by_department_*') if cache.make_key(k)])

    def perform_destroy(self, instance):
        instance.delete()
        cache.delete('invoices_list_page1')
        # Invalidate all sales stats caches
        cache.delete_many([cache.make_key(k) for k in cache.keys('sales_stats_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('daily_summary_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('monthly_summary_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('top_products_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('by_payment_method_*') if cache.make_key(k)])
        cache.delete_many([cache.make_key(k) for k in cache.keys('by_department_*') if cache.make_key(k)])

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invoice = serializer.save()
        return Response(
            InvoiceSerializer(invoice, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's invoices."""
        today = timezone.now().date()
        invoices = self.queryset.filter(invoice_date=today)
        serializer = InvoiceListSerializer(invoices, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending/unpaid invoices."""
        invoices = self.queryset.filter(payment_status__in=['pending', 'partial'])
        serializer = InvoiceListSerializer(invoices, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add payment to an invoice."""
        invoice = self.get_object()
        serializer = PaymentSerializer(data={**request.data, 'invoice': invoice.id})
        
        if serializer.is_valid():
            serializer.save(received_by=request.user)
            return Response(InvoiceSerializer(invoice).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an invoice."""
        invoice = self.get_object()
        
        if invoice.payment_status == 'paid':
            return Response(
                {'error': 'Cannot cancel a paid invoice'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        invoice.payment_status = 'cancelled'
        invoice.save()
        
        # Restore stock for all items
        for item in invoice.items.all():
            if item.product:
                item.product.current_stock += item.quantity
                item.product.save()
        
        return Response(InvoiceSerializer(invoice).data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get sales statistics."""
        # Cache stats response with days parameter
        days = int(request.query_params.get('days', 30))
        cache_key = f'sales_stats_{days}'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        # Date range filter
        start_date = timezone.now().date() - timedelta(days=days)

        queryset = self.queryset.filter(
            invoice_date__gte=start_date,
        ).exclude(payment_status='cancelled')

        stats = queryset.aggregate(
            total_sales=Sum('total_amount'),
            total_invoices=Count('id'),
            total_tax_collected=Sum('tax_amount'),
            total_discounts=Sum('discount_amount'),
            pending_amount=Sum('due_amount'),
            average_invoice_value=Avg('total_amount')
        )

        # Items sold
        items_sold = InvoiceItem.objects.filter(
            invoice__in=queryset
        ).aggregate(total=Sum('quantity'))['total'] or 0

        stats['total_items_sold'] = items_sold

        # Fill nulls with 0
        for key in stats:
            if stats[key] is None:
                stats[key] = 0

        cache.set(cache_key, stats, settings.CACHE_TIMEOUTS.get('stats', 60))
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def daily_summary(self, request):
        """Get daily sales summary."""
        days = int(request.query_params.get('days', 30))
        cache_key = f'daily_summary_{days}'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        start_date = timezone.now().date() - timedelta(days=days)

        summary = self.queryset.filter(
            invoice_date__gte=start_date,
        ).exclude(payment_status='cancelled').annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            total_sales=Sum('total_amount'),
            invoice_count=Count('id'),
            total_tax=Sum('tax_amount')
        ).order_by('date')

        result = list(summary)
        cache.set(cache_key, result, settings.CACHE_TIMEOUTS.get('stats', 60))
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        """Get monthly sales summary."""
        months = int(request.query_params.get('months', 12))
        cache_key = f'monthly_summary_{months}'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        start_date = timezone.now().date() - timedelta(days=months * 30)

        summary = self.queryset.filter(
            invoice_date__gte=start_date,
        ).exclude(payment_status='cancelled').annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total_sales=Sum('total_amount'),
            invoice_count=Count('id'),
            total_tax=Sum('tax_amount')
        ).order_by('month')

        result = list(summary)
        cache.set(cache_key, result, settings.CACHE_TIMEOUTS.get('stats', 60))
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def top_products(self, request):
        """Get top selling products."""
        days = int(request.query_params.get('days', 30))
        limit = int(request.query_params.get('limit', 10))
        cache_key = f'top_products_{days}_{limit}'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        start_date = timezone.now().date() - timedelta(days=days)

        top_products = InvoiceItem.objects.filter(
            invoice__invoice_date__gte=start_date,
        ).exclude(invoice__payment_status='cancelled').values(
            'product_id', 'product_name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total')
        ).order_by('-total_quantity')[:limit]

        result = list(top_products)
        cache.set(cache_key, result, settings.CACHE_TIMEOUTS.get('stats', 60))
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def by_payment_method(self, request):
        """Get sales breakdown by payment method."""
        days = int(request.query_params.get('days', 30))
        cache_key = f'by_payment_method_{days}'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        start_date = timezone.now().date() - timedelta(days=days)

        breakdown = self.queryset.filter(
            invoice_date__gte=start_date,
            payment_status__in=['paid', 'partial']
        ).values('payment_method').annotate(
            total=Sum('paid_amount'),
            count=Count('id')
        )

        result = list(breakdown)
        cache.set(cache_key, result, settings.CACHE_TIMEOUTS.get('stats', 60))
        return Response(result)

    @action(detail=False, methods=['get'])
    def by_department(self, request):
        """Get invoice value breakdown by department."""
        days = int(request.query_params.get('days', 30))
        cache_key = f'by_department_{days}'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        start_date = timezone.now().date() - timedelta(days=days)

        breakdown = self.queryset.filter(
            invoice_date__gte=start_date,
            department__isnull=False
        ).exclude(payment_status='cancelled').values(
            'department_id',
            'department__name',
            'department__code',
        ).annotate(
            total=Sum('total_amount'),
            count=Count('id')
        ).order_by('-total')

        result = [
            {
                'department_id': item['department_id'],
                'department_name': item['department__name'],
                'department_code': item['department__code'],
                'total': item['total'],
                'count': item['count'],
            }
            for item in breakdown
        ]
        cache.set(cache_key, result, settings.CACHE_TIMEOUTS.get('stats', 60))
        return Response(result)


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment management."""
    
    queryset = Payment.objects.select_related('invoice', 'received_by').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['invoice', 'payment_method', 'received_by']
    ordering = ['-payment_date']
    
    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)


class DailySalesViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for DailySales (read-only)."""
    
    queryset = DailySales.objects.all()
    serializer_class = DailySalesSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering = ['-date']


class ReturnViewSet(viewsets.ModelViewSet):
    """ViewSet for Return management."""
    
    queryset = Return.objects.select_related('invoice', 'invoice_item', 'processed_by').all()
    serializer_class = ReturnSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'reason', 'invoice']
    search_fields = ['return_number', 'invoice__invoice_number']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a return request."""
        return_obj = self.get_object()
        
        if return_obj.status != 'pending':
            return Response(
                {'error': 'Return is not pending'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return_obj.status = 'approved'
        return_obj.processed_by = request.user
        return_obj.processed_at = timezone.now()
        return_obj.save()
        
        # Restore stock
        if return_obj.invoice_item.product:
            product = return_obj.invoice_item.product
            product.current_stock += return_obj.quantity
            product.save()
        
        return Response(self.get_serializer(return_obj).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a return request."""
        return_obj = self.get_object()
        
        if return_obj.status != 'pending':
            return Response(
                {'error': 'Return is not pending'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return_obj.status = 'rejected'
        return_obj.processed_by = request.user
        return_obj.processed_at = timezone.now()
        return_obj.save()
        
        return Response(self.get_serializer(return_obj).data)
