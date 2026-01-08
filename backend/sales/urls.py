from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, PaymentViewSet, DailySalesViewSet, ReturnViewSet

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'daily-sales', DailySalesViewSet)
router.register(r'returns', ReturnViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
