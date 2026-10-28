"""Stock history (inward/outward movement log) retention helpers."""
from datetime import timedelta

from django.core.cache import cache
from django.utils import timezone

from .models import StockTransaction

STOCK_HISTORY_DAYS = 60
HISTORY_TYPES = ('in', 'sale')
_PRUNE_LOCK_KEY = 'stock_history_pruned'


def history_cutoff():
    return timezone.now() - timedelta(days=STOCK_HISTORY_DAYS)


def prune_stock_history():
    """Permanently delete stock movements older than the retention window. Returns the number deleted."""
    deleted, _ = StockTransaction.objects.filter(created_at__lt=history_cutoff()).delete()
    return deleted


def prune_if_due():
    """Prune at most once a day (guarded by a cache lock)."""
    if cache.add(_PRUNE_LOCK_KEY, 1, 24 * 60 * 60):
        prune_stock_history()
