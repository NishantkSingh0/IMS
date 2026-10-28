from django.db.models import Count, Sum
from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, DateFilter
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
import pandas as pd

from inventory.views import IsOwnerOrManager
from .models import PurchaseInvoice
from .serializers import (
    PurchaseInvoiceCreateSerializer, PurchaseInvoiceListSerializer, PurchaseInvoiceSerializer
)
from .services import find_duplicate_invoice


class PurchaseInvoiceFilter(FilterSet):
    invoice_date_gte = DateFilter(field_name='supplier_invoice_date', lookup_expr='gte')
    invoice_date_lte = DateFilter(field_name='supplier_invoice_date', lookup_expr='lte')

    class Meta:
        model = PurchaseInvoice
        fields = ['supplier', 'created_by']


class PurchaseInvoiceViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Inward invoices: list, view and submit only. Submitted inwards cannot be edited, reverted or deleted."""

    queryset = (
        PurchaseInvoice.objects.select_related('supplier', 'created_by')
        .annotate(item_count=Count('items', distinct=True))
        .prefetch_related('items')
    )
    permission_classes = [IsOwnerOrManager]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = PurchaseInvoiceFilter
    search_fields = ['inward_number', 'supplier_invoice_number', 'supplier_name', 'supplier_gstin', 'po_number', 'items__product_name']
    ordering_fields = ['created_at', 'supplier_invoice_date', 'total_amount']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        # Searching across items can repeat a row per matching item
        return queryset.distinct() if self.request.query_params.get('search') else queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return PurchaseInvoiceListSerializer
        if self.action == 'create':
            return PurchaseInvoiceCreateSerializer
        return PurchaseInvoiceSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        purchase = serializer.save()
        purchase = self.get_queryset().get(pk=purchase.pk)
        return Response(PurchaseInvoiceSerializer(purchase, context=self.get_serializer_context()).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def check_invoice(self, request):
        """Check whether a vendor's invoice number has already been recorded."""
        supplier_id = request.query_params.get('supplier')
        invoice_number = (request.query_params.get('invoice_number') or '').strip()
        if not supplier_id or not supplier_id.isdigit() or not invoice_number:
            return Response({'error': 'supplier and invoice_number are required'}, status=status.HTTP_400_BAD_REQUEST)

        duplicate = find_duplicate_invoice(int(supplier_id), invoice_number)
        return Response({
            'exists': bool(duplicate),
            'id': duplicate.id if duplicate else None,
            'inward_number': duplicate.inward_number if duplicate else None,
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Inward totals: overall and current month."""
        queryset = PurchaseInvoice.objects.all()
        today = timezone.localdate()
        month = queryset.filter(created_at__year=today.year, created_at__month=today.month)
        return Response({
            'total_inwards': queryset.count(),
            'total_value': queryset.aggregate(total=Sum('total_amount'))['total'] or 0,
            'month_inwards': month.count(),
            'month_value': month.aggregate(total=Sum('total_amount'))['total'] or 0,
        })

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        """Export filtered inwards to Excel, one row per item."""
        purchases = self.filter_queryset(self.get_queryset())

        columns = [
            'Inward No', 'Inward At', 'Vendor', 'GSTIN/UIN', 'Invoice No', 'Invoice Date', 'PO No',
            'Product SKU', 'Product Name', 'Category', 'Quantity', 'Unit', 'Rate', 'GST (%)', 'GST Amount',
            'Amount', 'Price Change', 'Freight Charges', 'Inward By',
        ]
        data = []
        for purchase in purchases:
            for item in purchase.items.all():
                data.append({
                    'Inward No': purchase.inward_number,
                    'Inward At': timezone.localtime(purchase.created_at).strftime('%Y-%m-%d %H:%M:%S'),
                    'Vendor': purchase.supplier_name,
                    'GSTIN/UIN': purchase.supplier_gstin,
                    'Invoice No': purchase.supplier_invoice_number,
                    'Invoice Date': purchase.supplier_invoice_date.strftime('%Y-%m-%d'),
                    'PO No': purchase.po_number,
                    'Product SKU': item.product_sku,
                    'Product Name': item.product_name,
                    'Category': item.category_name,
                    'Quantity': float(item.quantity),
                    'Unit': item.unit,
                    'Rate': float(item.unit_price),
                    'GST (%)': float(item.tax_rate),
                    'GST Amount': float(item.tax_amount),
                    'Amount': float(item.total),
                    'Price Change': 'Yes' if item.is_price_change else 'No',
                    'Freight Charges': float(purchase.freight_charges),
                    'Inward By': purchase.created_by.get_full_name() if purchase.created_by else '',
                })

        df = pd.DataFrame(data, columns=columns)

        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="inwards_export.xlsx"'

        with pd.ExcelWriter(response, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Inwards', index=False)
            worksheet = writer.sheets['Inwards']
            for idx, col in enumerate(df.columns, 1):
                max_length = max(df[col].astype(str).apply(len).max() if len(df) else 0, len(col))
                worksheet.column_dimensions[worksheet.cell(row=1, column=idx).column_letter].width = min(max_length + 2, 50)

        return response
