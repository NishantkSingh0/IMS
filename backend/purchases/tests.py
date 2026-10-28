from decimal import Decimal

from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase

from inventory.models import Category, Product, StockTransaction, Supplier
from staff.models import User
from .models import PurchaseInvoice

LIST_URL = '/api/purchases/inwards/'


class InwardTests(APITestCase):
    def setUp(self):
        self.manager = User.objects.create_user(email='manager@test.com', password='pass12345', first_name='M', last_name='G', role='manager')
        self.client.force_authenticate(self.manager)
        self.supplier = Supplier.objects.create(
            name='Aggarwal Mill Store', phone='9999999999', address='Hauz Qazi', city='Delhi',
            state='Delhi', pincode='110006', gst_number='07ABYFA6201G1ZD',
        )
        self.tools = Category.objects.create(name='TOOLS')
        self.metal = Category.objects.create(name='METAL')
        self.tap = Product.objects.create(name='THREAD TAP HSS 6MM', category=self.tools, cost_price=Decimal('1087.00'), unit='pack', gst_rate=18, hsn_code='8207', current_stock=1, wastage_percent=Decimal('5'))

    def payload(self, items, number='AM/25-27/317', **extra):
        return {
            'supplier_id': self.supplier.id,
            'supplier_invoice_number': number,
            'supplier_invoice_date': '2026-05-11',
            'po_number': 'PO-1',
            'items': items,
            **extra,
        }

    def post(self, data):
        return self.client.post(LIST_URL, data, format='json')

    def test_same_price_increases_stock_and_logs_transaction(self):
        res = self.post(self.payload([{'product_id': self.tap.id, 'quantity': '2', 'unit_price': '1087.00'}]))
        self.assertEqual(res.status_code, 201, res.data)
        self.tap.refresh_from_db()
        self.assertEqual(self.tap.current_stock, Decimal('3'))
        self.assertEqual(self.tap.cost_price, Decimal('1087.00'))
        self.assertFalse(res.data['items'][0]['is_price_change'])
        txn = StockTransaction.objects.get(product=self.tap)
        self.assertEqual((txn.transaction_type, txn.previous_stock, txn.new_stock), ('in', Decimal('1'), Decimal('3')))
        self.assertIn('AM/25-27/317', txn.reference)

    def test_price_change_creates_separate_item_and_reuses_it(self):
        res = self.post(self.payload([{'product_id': self.tap.id, 'quantity': '2', 'unit_price': '1200.00'}]))
        self.assertEqual(res.status_code, 201, res.data)
        self.tap.refresh_from_db()
        self.assertEqual((self.tap.current_stock, self.tap.cost_price), (Decimal('1'), Decimal('1087.00')))

        variant = Product.objects.get(parent_product=self.tap)
        self.assertEqual(variant.name, 'THREAD TAP HSS 6MM (price change)')
        self.assertEqual((variant.cost_price, variant.current_stock, variant.unit), (Decimal('1200.00'), Decimal('2'), 'pack'))
        self.assertEqual(variant.category, self.tools)
        self.assertTrue(res.data['items'][0]['is_price_change'])
        self.assertEqual(res.data['items'][0]['category_name'], 'TOOLS')

        # Same new price again (selecting the original) reuses the variant instead of creating another
        res = self.post(self.payload([{'product_id': self.tap.id, 'quantity': '1', 'unit_price': '1200'}], number='AM/25-27/318'))
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(Product.objects.filter(parent_product=self.tap).count(), 1)
        variant.refresh_from_db()
        self.assertEqual(variant.current_stock, Decimal('3'))

        # Selecting a variant with the original's price routes stock back to the original
        res = self.post(self.payload([{'product_id': variant.id, 'quantity': '1', 'unit_price': '1087'}], number='AM/25-27/319'))
        self.assertEqual(res.status_code, 201, res.data)
        self.tap.refresh_from_db()
        self.assertEqual(self.tap.current_stock, Decimal('2'))

    def test_duplicate_invoice_number_rejected_case_and_space_insensitive(self):
        self.assertEqual(self.post(self.payload([{'product_id': self.tap.id, 'quantity': '1', 'unit_price': '1087'}])).status_code, 201)
        res = self.post(self.payload([{'product_id': self.tap.id, 'quantity': '1', 'unit_price': '1087'}], number=' am/25-27/ 317 '))
        self.assertEqual(res.status_code, 400)
        self.assertIn('supplier_invoice_number', res.data)
        self.tap.refresh_from_db()
        self.assertEqual(self.tap.current_stock, Decimal('2'))

        check = self.client.get(LIST_URL + 'check_invoice/', {'supplier': self.supplier.id, 'invoice_number': 'AM/25-27/317'})
        self.assertTrue(check.data['exists'])

    def test_new_product_created_and_stocked(self):
        res = self.post(self.payload([{
            'new_product': {'name': 'Vice  Bench 6"', 'unit': 'PCS', 'hsn_code': '8205', 'gst_rate': '18', 'wastage_percent': '5', 'category': self.tools.id},
            'quantity': '1', 'unit_price': '9200',
        }]))
        self.assertEqual(res.status_code, 201, res.data)
        product = Product.objects.get(name='Vice Bench 6"')
        self.assertEqual((product.current_stock, product.cost_price, product.unit), (Decimal('1'), Decimal('9200'), 'pcs'))
        self.assertEqual(product.category, self.tools)

    def test_new_product_requires_category(self):
        res = self.post(self.payload([{
            'new_product': {'name': 'Vice Bench 6"', 'unit': 'pcs', 'gst_rate': '18', 'wastage_percent': '0'},
            'quantity': '1', 'unit_price': '9200',
        }]))
        self.assertEqual(res.status_code, 400)
        self.assertFalse(Product.objects.filter(name='Vice Bench 6"').exists())

    def test_uncategorised_product_requires_category_which_is_saved(self):
        bare = Product.objects.create(name='Hand File 12"', cost_price=Decimal('484'), unit='pcs', gst_rate=18, wastage_percent=Decimal('2'))
        item = {'product_id': bare.id, 'quantity': '5', 'unit_price': '484'}
        res = self.post(self.payload([item]))
        self.assertEqual(res.status_code, 400)
        self.assertIn('category_id', str(res.data))

        res = self.post(self.payload([{**item, 'category_id': self.metal.id}]))
        self.assertEqual(res.status_code, 201, res.data)
        bare.refresh_from_db()
        self.assertEqual(bare.category, self.metal)
        self.assertEqual(res.data['items'][0]['category_name'], 'METAL')

    def test_existing_category_is_never_changed(self):
        res = self.post(self.payload([{'product_id': self.tap.id, 'quantity': '1', 'unit_price': '1087', 'category_id': self.metal.id}]))
        self.assertEqual(res.status_code, 201, res.data)
        self.tap.refresh_from_db()
        self.assertEqual(self.tap.category, self.tools)

    def test_new_product_with_existing_name_rejected(self):
        res = self.post(self.payload([{
            'new_product': {'name': 'thread tap hss 6mm', 'unit': 'pcs', 'gst_rate': '18', 'wastage_percent': '0', 'category': self.tools.id},
            'quantity': '1', 'unit_price': '10',
        }]))
        self.assertEqual(res.status_code, 400)
        self.assertFalse(PurchaseInvoice.objects.exists())

    def test_totals_match_paper_invoice(self):
        res = self.post(self.payload([
            {'product_id': self.tap.id, 'quantity': '2', 'unit_price': '1087'},
            {'new_product': {'name': 'Tool Bit Blank', 'unit': 'pcs', 'gst_rate': '18', 'wastage_percent': '0', 'category': self.tools.id}, 'quantity': '2', 'unit_price': '3788'},
        ], round_off='0.10'))
        self.assertEqual(res.status_code, 201, res.data)
        # 2174 + 7576 = 9750; GST 18% = 1755; total = 11505.10
        self.assertEqual(Decimal(res.data['subtotal']), Decimal('9750.00'))
        self.assertEqual(Decimal(res.data['tax_amount']), Decimal('1755.00'))
        self.assertEqual(Decimal(res.data['total_amount']), Decimal('11505.10'))

    def test_freight_charges_add_to_total_and_are_stored(self):
        res = self.post(self.payload([
            {'product_id': self.tap.id, 'quantity': '1', 'unit_price': '1087'},
        ], round_off='0.10', freight_charges='250'))
        self.assertEqual(res.status_code, 201, res.data)
        # 1087 + GST 18% (195.66) + round 0.10 + freight 250 = 1532.76
        self.assertEqual(Decimal(res.data['freight_charges']), Decimal('250.00'))
        self.assertEqual(Decimal(res.data['total_amount']), Decimal('1532.76'))

    def test_invalid_item_rolls_back_everything(self):
        res = self.post(self.payload([
            {'product_id': self.tap.id, 'quantity': '1', 'unit_price': '1087'},
            {'product_id': 999999, 'quantity': '1', 'unit_price': '10'},
        ]))
        self.assertEqual(res.status_code, 400)
        self.tap.refresh_from_db()
        self.assertEqual(self.tap.current_stock, Decimal('1'))
        self.assertFalse(PurchaseInvoice.objects.exists())

    def test_submitted_inward_cannot_be_edited_or_deleted(self):
        res = self.post(self.payload([{'product_id': self.tap.id, 'quantity': '1', 'unit_price': '1087'}]))
        url = f"{LIST_URL}{res.data['id']}/"
        self.assertEqual(self.client.put(url, {}, format='json').status_code, 405)
        self.assertEqual(self.client.patch(url, {}, format='json').status_code, 405)
        self.assertEqual(self.client.delete(url).status_code, 405)

        purchase = PurchaseInvoice.objects.get(pk=res.data['id'])
        with self.assertRaises(ValidationError):
            purchase.notes = 'changed'
            purchase.save()
        with self.assertRaises(ValidationError):
            purchase.delete()

    def test_only_owner_or_manager_can_access(self):
        worker = User.objects.create_user(email='worker@test.com', password='pass12345', first_name='W', last_name='K', role='worker')
        self.client.force_authenticate(worker)
        self.assertEqual(self.client.get(LIST_URL).status_code, 403)
        self.assertEqual(self.post(self.payload([{'product_id': self.tap.id, 'quantity': '1', 'unit_price': '1087'}])).status_code, 403)

    def test_list_search_and_export(self):
        self.post(self.payload([
            {'product_id': self.tap.id, 'quantity': '1', 'unit_price': '1087'},
            {'product_id': self.tap.id, 'quantity': '1', 'unit_price': '1087'},
        ]))
        res = self.client.get(LIST_URL, {'search': 'thread tap'})
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['item_count'], 2)
        export = self.client.get(LIST_URL + 'export_excel/')
        self.assertEqual(export.status_code, 200)
        self.assertIn('spreadsheetml', export['Content-Type'])

    def test_future_invoice_date_rejected(self):
        res = self.post(self.payload([{'product_id': self.tap.id, 'quantity': '1', 'unit_price': '1087'}], supplier_invoice_date='2999-01-01'))
        self.assertEqual(res.status_code, 400)
        self.assertIn('supplier_invoice_date', res.data)
