from django.core.management.base import BaseCommand

from inventory.history import STOCK_HISTORY_DAYS, prune_stock_history


class Command(BaseCommand):
    help = f'Delete stock movement history older than {STOCK_HISTORY_DAYS} days.'

    def handle(self, *args, **options):
        deleted = prune_stock_history()
        self.stdout.write(self.style.SUCCESS(f'Deleted {deleted} stock movement(s) older than {STOCK_HISTORY_DAYS} days.'))
