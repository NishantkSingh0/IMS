from django.contrib import admin
from .models import PurchaseInvoice, PurchaseItem


class ReadOnlyAdminMixin:
    """Submitted inwards are view-only in admin."""

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class PurchaseItemInline(ReadOnlyAdminMixin, admin.TabularInline):
    model = PurchaseItem
    extra = 0


@admin.register(PurchaseInvoice)
class PurchaseInvoiceAdmin(ReadOnlyAdminMixin, admin.ModelAdmin):
    list_display = ('inward_number', 'supplier_name', 'supplier_invoice_number', 'supplier_invoice_date', 'total_amount', 'created_at')
    list_filter = ('supplier_invoice_date', 'supplier')
    search_fields = ('inward_number', 'supplier_invoice_number', 'supplier_name', 'po_number')
    inlines = [PurchaseItemInline]
