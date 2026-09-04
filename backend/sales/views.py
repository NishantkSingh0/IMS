from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta
from .models import Invoice, InvoiceItem, Payment, DailySales, Return
from .serializers import (
    InvoiceSerializer, InvoiceListSerializer, InvoiceCreateSerializer,
    InvoiceItemSerializer, PaymentSerializer, DailySalesSerializer,
    ReturnSerializer
)


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for Invoice management."""
    
    queryset = Invoice.objects.select_related('customer', 'department', 'created_by').prefetch_related('items', 'payments').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'customer', 'created_by']
    search_fields = ['invoice_number', 'department__name', 'department__code', 'notes']
    ordering_fields = ['created_at', 'total_amount', 'invoice_date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer
    
    def perform_create(self, serializer):
        serializer.save()

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
        # Date range filter
        days = int(request.query_params.get('days', 30))
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
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def daily_summary(self, request):
        """Get daily sales summary."""
        days = int(request.query_params.get('days', 30))
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
        
        return Response(list(summary))
    
    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        """Get monthly sales summary."""
        months = int(request.query_params.get('months', 12))
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
        
        return Response(list(summary))
    
    @action(detail=False, methods=['get'])
    def top_products(self, request):
        """Get top selling products."""
        days = int(request.query_params.get('days', 30))
        limit = int(request.query_params.get('limit', 10))
        start_date = timezone.now().date() - timedelta(days=days)
        
        top_products = InvoiceItem.objects.filter(
            invoice__invoice_date__gte=start_date,
        ).exclude(invoice__payment_status='cancelled').values(
            'product_id', 'product_name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total')
        ).order_by('-total_quantity')[:limit]
        
        return Response(list(top_products))
    
    @action(detail=False, methods=['get'])
    def by_payment_method(self, request):
        """Get sales breakdown by payment method."""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)
        
        breakdown = self.queryset.filter(
            invoice_date__gte=start_date,
            payment_status__in=['paid', 'partial']
        ).values('payment_method').annotate(
            total=Sum('paid_amount'),
            count=Count('id')
        )
        
        return Response(list(breakdown))

    @action(detail=False, methods=['get'])
    def by_department(self, request):
        """Get invoice value breakdown by department."""
        days = int(request.query_params.get('days', 30))
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

        return Response([
            {
                'department_id': item['department_id'],
                'department_name': item['department__name'],
                'department_code': item['department__code'],
                'total': item['total'],
                'count': item['count'],
            }
            for item in breakdown
        ])


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
