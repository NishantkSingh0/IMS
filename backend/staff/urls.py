from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, PermissionViewSet, RolePermissionViewSet, 
    ActivityLogViewSet, CustomTokenObtainPairView, logout_view
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'permissions', PermissionViewSet)
router.register(r'role-permissions', RolePermissionViewSet)
router.register(r'activity-logs', ActivityLogViewSet)

urlpatterns = [
    path('token', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout', logout_view, name='logout'),
    path('', include(router.urls)),
]
