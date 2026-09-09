from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.conf import settings
from django.core.cache import cache
from .models import Permission, RolePermission, ActivityLog
from .serializers import (
    UserSerializer, UserListSerializer, PermissionSerializer,
    RolePermissionSerializer, ActivityLogSerializer, ChangePasswordSerializer,
    CustomTokenObtainPairSerializer
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view that uses email instead of username."""
    serializer_class = CustomTokenObtainPairSerializer


class IsOwnerOrManager(permissions.BasePermission):
    """Permission class for owner/manager access."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['owner', 'manager']


class IsManagerOnly(permissions.BasePermission):
    """Permission class for manager-only access (not owner)."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'manager'


class IsOwner(permissions.BasePermission):
    """Permission class for owner-only access."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_owner


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User management."""
    
    queryset = User.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering_fields = ['date_joined', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsOwner()]
        if self.action in ['list', 'retrieve', 'update', 'partial_update', 'stats', 'me']:
            return [IsOwnerOrManager()]
        if self.action in ['change_password']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """Add explicit error handling for create operations."""
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'error': f'Failed to create user: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def list(self, request, *args, **kwargs):
        """Override list to handle errors and add cache invalidation."""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch users: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        serializer.save()
        cache.delete('staff_stats')
    
    def perform_update(self, serializer):
        serializer.save()
        cache.delete('staff_stats')
    
    def perform_destroy(self, instance):
        instance.delete()
        cache.delete('staff_stats')
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile."""
        try:
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'User not authenticated'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch profile: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change current user's password."""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsOwnerOrManager])
    def stats(self, request):
        """Get staff statistics."""
        # Cache stats response
        cache_key = 'staff_stats'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        try:
            stats = {
                'total_staff': User.objects.count(),
                'active_staff': User.objects.filter(is_active=True).count(),
                'by_role': {
                    role[0]: User.objects.filter(role=role[0]).count()
                    for role in User.ROLE_CHOICES
                }
            }
            cache.set(cache_key, stats, settings.CACHE_TIMEOUTS.get('stats', 60))
            return Response(stats)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch stats: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PermissionViewSet(viewsets.ModelViewSet):
    """ViewSet for Permission management."""
    
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsOwner]


class RolePermissionViewSet(viewsets.ModelViewSet):
    """ViewSet for RolePermission management."""
    
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer
    permission_classes = [IsOwner]
    filterset_fields = ['role']


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for ActivityLog (read-only)."""

    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsOwnerOrManager]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['user', 'action', 'model_name']
    search_fields = ['description', 'user__email', 'user__first_name']
    ordering = ['-timestamp']
    
    @action(detail=False, methods=['get'])
    def my_activity(self, request):
        """Get current user's activity log."""
        logs = self.queryset.filter(user=request.user)[:50]
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
