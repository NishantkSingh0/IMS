from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Permission, RolePermission, ActivityLog
from .serializers import (
    UserSerializer, UserListSerializer, PermissionSerializer,
    RolePermissionSerializer, ActivityLogSerializer, ChangePasswordSerializer
)

User = get_user_model()


class IsOwnerOrManager(permissions.BasePermission):
    """Permission class for owner/manager access."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_manager


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
        if self.action in ['list', 'retrieve', 'update', 'partial_update']:
            return [IsOwnerOrManager()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change current user's password."""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get staff statistics."""
        if not request.user.is_manager:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        stats = {
            'total_staff': User.objects.count(),
            'active_staff': User.objects.filter(is_active=True).count(),
            'by_role': {
                role[0]: User.objects.filter(role=role[0]).count()
                for role in User.ROLE_CHOICES
            }
        }
        return Response(stats)


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
    
    queryset = ActivityLog.objects.all()
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
