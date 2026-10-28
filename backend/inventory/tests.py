from datetime import timedelta
from decimal import Decimal
from io import BytesIO

import pandas as pd
from django.utils import timezone
from rest_framework.test import APITestCase

from staff.models import User
from .history import prune_stock_history
from .models import Category, Department, Product, StockTransaction, Supplier

PRODUCTS_URL = '/api/inventory/products/'


class StockHistoryTests(APITestCase):
    def setUp(self):
        self.manager = User.objects.create_user(email='manager@test.com', password='pass12345', first_name='M', last_name='G', role='manager')
        self.client.force_authenticate(self.manager)
        self.supplier = Supplier.objects.create(
            name='Aggarwal Mill Store', phone='9999999999', address='Hauz Qazi', city='Delhi',
            state='Delhi', pincode='110006', gst_number='07ABYFA6201G1ZD',
        )
        self.department = Department.objects.create(name='Fabrication', code='FAB')
        self.tools = Category.objects.create(name='TOOLS')
        self.tap = Product.objects.create(name='THREAD TAP', category=self.tools, cost_price=Decimal('100.00'), unit='pcs', current_stock=0)
        self.idle = Product.objects.create(name='IDLE ITEM', category=self.tools, cost_price=Decimal('10.00'), unit='pcs', current_stock=3)

    def inward(self, quantity, number='INV-1'):
        res = self.client.post('/api/purchases/inwards/', {
            'supplier_id': self.supplier.id, 'supplier_invoice_number': number,
            'supplier_invoice_date': timezone.localdate().isoformat(), 'po_number': 'PO-9',
            'items': [{'product_id': self.tap.id, 'quantity': str(quantity), 'unit_price': '100.00'}],
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        return res.data

    def outward(self, quantity):
        res = self.client.post('/api/sales/invoices/', {
            'department_id': self.department.id, 'project_name': 'Bridge Job',
            'items': [{'product_id': self.tap.id, 'quantity': str(quantity)}],
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        return res.data

    def history(self, **params):
        return self.client.get(f'{PRODUCTS_URL}{self.tap.id}/history/', params)

    def test_inward_and_outward_are_linked_signed_and_update_last_movement(self):
        inward = self.inward(5)
        outward = self.outward(2)

        self.tap.refresh_from_db()
        self.assertIsNotNone(self.tap.last_movement_at)
        self.assertEqual(self.tap.current_stock, Decimal('3'))

        res = self.history()
        self.assertEqual(res.status_code, 200)
        out_row, in_row = res.data['results']
        self.assertEqual((in_row['movement'], Decimal(in_row['change'])), ('inward', Decimal('5')))
        self.assertEqual((Decimal(in_row['stock_before']), Decimal(in_row['stock_after'])), (Decimal('0'), Decimal('5')))
        self.assertEqual(in_row['inward_number'], inward['inward_number'])
        self.assertEqual((in_row['vendor_invoice_number'], in_row['vendor_name'], in_row['po_number']), ('INV-1', 'Aggarwal Mill Store', 'PO-9'))
        self.assertEqual((out_row['movement'], Decimal(out_row['change'])), ('outward', Decimal('-2')))
        self.assertEqual((out_row['slip_number'], out_row['department_name'], out_row['project_name']),
                         (outward['invoice_number'], 'Fabrication', 'Bridge Job'))

        summary = res.data['summary']
        self.assertEqual((Decimal(summary['opening_stock']), Decimal(summary['total_in']), Decimal(summary['total_out'])),
                         (Decimal('0'), Decimal('5'), Decimal('2')))
        self.assertEqual(Decimal(summary['current_stock']), Decimal('3'))
        self.assertEqual(res.data['product']['name'], 'THREAD TAP')

    def test_history_filters_and_retention_window(self):
        self.inward(5)
        self.outward(2)
        self.assertEqual(self.history(movement='inward').data['count'], 1)
        self.assertEqual(self.history(movement='outward').data['count'], 1)
        tomorrow = (timezone.localdate() + timedelta(days=1)).isoformat()
        self.assertEqual(self.history(date_from=tomorrow).data['count'], 0)

        # Adjustments are not part of the history; movements older than 60 days are hidden and pruned
        StockTransaction.objects.create(product=self.tap, transaction_type='adjustment', quantity=1, previous_stock=3, new_stock=1)
        old = StockTransaction.objects.create(product=self.tap, transaction_type='in', quantity=1, previous_stock=0, new_stock=1)
        StockTransaction.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(days=61))
        self.assertEqual(self.history().data['count'], 2)

        self.assertEqual(prune_stock_history(), 1)
        self.assertFalse(StockTransaction.objects.filter(pk=old.pk).exists())
        self.assertEqual(StockTransaction.objects.count(), 3)

    def test_products_filter_and_export_by_last_updated(self):
        self.inward(5)
        today = timezone.localdate().isoformat()
        res = self.client.get(PRODUCTS_URL, {'updated_from': today, 'updated_to': today})
        self.assertEqual([p['name'] for p in res.data['results']], ['THREAD TAP'])
        self.assertIsNotNone(res.data['results'][0]['last_movement_at'])

        yesterday = (timezone.localdate() - timedelta(days=1)).isoformat()
        self.assertEqual(self.client.get(PRODUCTS_URL, {'updated_to': yesterday}).data['count'], 0)

        export = self.client.get(PRODUCTS_URL + 'export_excel/', {'updated_from': today})
        self.assertEqual(export.status_code, 200)
        df = pd.read_excel(BytesIO(export.content))
        self.assertEqual(list(df['Product_Name']), ['THREAD TAP'])
        self.assertEqual(df['Last_Updated'][0], timezone.localdate().strftime('%d-%m-%Y'))

    def test_history_requires_owner_or_manager(self):
        worker = User.objects.create_user(email='worker@test.com', password='pass12345', first_name='W', last_name='K', role='worker')
        self.client.force_authenticate(worker)
        self.assertEqual(self.history().status_code, 403)
