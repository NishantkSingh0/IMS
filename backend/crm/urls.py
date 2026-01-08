from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, CustomerHistoryViewSet, CustomerNoteViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'history', CustomerHistoryViewSet)
router.register(r'notes', CustomerNoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
