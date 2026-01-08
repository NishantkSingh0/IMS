from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, PermissionViewSet, RolePermissionViewSet, ActivityLogViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'permissions', PermissionViewSet)
router.register(r'role-permissions', RolePermissionViewSet)
router.register(r'activity-logs', ActivityLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
