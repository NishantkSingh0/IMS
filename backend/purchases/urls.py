from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PurchaseInvoiceViewSet

router = DefaultRouter()
router.register(r'inwards', PurchaseInvoiceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
