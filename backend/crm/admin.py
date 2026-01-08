from django.contrib import admin
from .models import Customer, CustomerHistory, CustomerNote


class CustomerHistoryInline(admin.TabularInline):
    model = CustomerHistory
    extra = 0
    readonly_fields = ('interaction_type', 'description', 'amount', 'reference', 'created_by', 'created_at')


class CustomerNoteInline(admin.TabularInline):
    model = CustomerNote
    extra = 0


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'email', 'customer_type', 'outstanding_amount', 'total_purchases', 'is_active')
    list_filter = ('customer_type', 'city', 'is_active')
    search_fields = ('name', 'email', 'phone', 'company_name')
    readonly_fields = ('outstanding_amount', 'total_purchases', 'total_orders', 'created_at', 'updated_at')
    inlines = [CustomerNoteInline, CustomerHistoryInline]


@admin.register(CustomerHistory)
class CustomerHistoryAdmin(admin.ModelAdmin):
    list_display = ('customer', 'interaction_type', 'amount', 'created_by', 'created_at')
    list_filter = ('interaction_type', 'created_at')
    search_fields = ('customer__name', 'description', 'reference')


@admin.register(CustomerNote)
class CustomerNoteAdmin(admin.ModelAdmin):
    list_display = ('customer', 'note', 'is_important', 'created_by', 'created_at')
    list_filter = ('is_important', 'created_at')
    search_fields = ('customer__name', 'note')
