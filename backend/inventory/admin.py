from django.contrib import admin
from .models import Category, Supplier, Department, Product, StockTransaction, LowStockAlert


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'product_count', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'phone', 'city', 'is_active')
    list_filter = ('city', 'state', 'is_active')
    search_fields = ('name', 'contact_person', 'email', 'phone')


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'code', 'description')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'selling_price', 'current_stock', 'is_low_stock', 'is_active')
    list_filter = ('category', 'supplier', 'is_active', 'unit')
    search_fields = ('name', 'sku', 'barcode', 'description')
    readonly_fields = ('sku', 'created_at', 'updated_at')


@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = ('product', 'transaction_type', 'quantity', 'previous_stock', 'new_stock', 'performed_by', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('product__name', 'reference', 'notes')
    readonly_fields = ('product', 'transaction_type', 'quantity', 'previous_stock', 'new_stock', 'performed_by', 'created_at')


@admin.register(LowStockAlert)
class LowStockAlertAdmin(admin.ModelAdmin):
    list_display = ('product', 'current_stock', 'min_stock_level', 'is_acknowledged', 'created_at')
    list_filter = ('is_acknowledged', 'created_at')
    search_fields = ('product__name',)
