from django.contrib import admin
from .models import Invoice, InvoiceItem, Payment, DailySales, Return


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0
    readonly_fields = ('tax_amount', 'total')


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'department', 'total_amount', 'invoice_date')
    list_filter = ('department', 'invoice_date')
    search_fields = ('invoice_number', 'department__name', 'department__code')
    readonly_fields = ('invoice_number', 'subtotal', 'tax_amount', 'total_amount', 'created_at')
    inlines = [InvoiceItemInline, PaymentInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'amount', 'received_by', 'payment_date')
    list_filter = ('payment_date',)
    search_fields = ('invoice__invoice_number', 'reference')


@admin.register(DailySales)
class DailySalesAdmin(admin.ModelAdmin):
    list_display = ('date', 'total_invoices', 'total_sales', 'total_tax')
    list_filter = ('date',)
    ordering = ('-date',)


@admin.register(Return)
class ReturnAdmin(admin.ModelAdmin):
    list_display = ('return_number', 'invoice', 'reason', 'refund_amount', 'status', 'created_at')
    list_filter = ('status', 'reason', 'created_at')
    search_fields = ('return_number', 'invoice__invoice_number')
