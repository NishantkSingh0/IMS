from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, SupplierViewSet, DepartmentViewSet, ProductViewSet,
    StockTransactionViewSet, LowStockAlertViewSet
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'products', ProductViewSet)
router.register(r'stock-transactions', StockTransactionViewSet)
router.register(r'low-stock-alerts', LowStockAlertViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
