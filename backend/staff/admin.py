from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Permission, RolePermission, ActivityLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone', 'address', 'avatar')}),
        ('Employment', {'fields': ('role', 'salary', 'hire_date')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'codename', 'description')
    search_fields = ('name', 'codename')


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'permission')
    list_filter = ('role',)


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'model_name', 'timestamp')
    list_filter = ('action', 'model_name', 'timestamp')
    search_fields = ('user__email', 'description')
    readonly_fields = ('user', 'action', 'model_name', 'object_id', 'description', 'ip_address', 'user_agent', 'timestamp')
