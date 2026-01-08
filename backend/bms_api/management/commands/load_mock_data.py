"""
Management command to load comprehensive mock data for the BMS system.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Load mock data for the Business Management System'

    def handle(self, *args, **options):
        self.stdout.write('Loading mock data...')
        
        self.create_users()
        self.create_categories()
        self.create_suppliers()
        self.create_products()
        self.create_customers()
        self.create_invoices()
        
        self.stdout.write(self.style.SUCCESS('Successfully loaded all mock data!'))

    def create_users(self):
        """Create demo users."""
        from staff.models import User
        
        users_data = [
            {
                'email': 'owner@example.com',
                'password': 'owner123',
                'first_name': 'Rajesh',
                'last_name': 'Kumar',
                'role': 'owner',
                'phone': '9876543210',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'manager@example.com',
                'password': 'manager123',
                'first_name': 'Priya',
                'last_name': 'Sharma',
                'role': 'manager',
                'phone': '9876543211',
            },
            {
                'email': 'cashier1@example.com',
                'password': 'cashier123',
                'first_name': 'Amit',
                'last_name': 'Singh',
                'role': 'cashier',
                'phone': '9876543212',
            },
            {
                'email': 'cashier2@example.com',
                'password': 'cashier123',
                'first_name': 'Neha',
                'last_name': 'Patel',
                'role': 'cashier',
                'phone': '9876543213',
            },
            {
                'email': 'worker@example.com',
                'password': 'worker123',
                'first_name': 'Ravi',
                'last_name': 'Verma',
                'role': 'worker',
                'phone': '9876543214',
            },
        ]
        
        for user_data in users_data:
            password = user_data.pop('password')
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults=user_data
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f'Created user: {user.email}')
            else:
                self.stdout.write(f'User already exists: {user.email}')

    def create_categories(self):
        """Create product categories."""
        from inventory.models import Category
        
        categories = [
            {'name': 'Electronics', 'description': 'Electronic devices and accessories'},
            {'name': 'Groceries', 'description': 'Daily groceries and food items'},
            {'name': 'Clothing', 'description': 'Men, Women, and Kids clothing'},
            {'name': 'Home & Kitchen', 'description': 'Home appliances and kitchen items'},
            {'name': 'Beauty & Personal Care', 'description': 'Beauty products and personal care items'},
            {'name': 'Sports & Fitness', 'description': 'Sports equipment and fitness accessories'},
            {'name': 'Books & Stationery', 'description': 'Books, notebooks, and stationery items'},
            {'name': 'Toys & Games', 'description': 'Toys and games for all ages'},
            {'name': 'Health & Wellness', 'description': 'Health supplements and wellness products'},
            {'name': 'Beverages', 'description': 'Drinks and beverages'},
        ]
        
        for cat_data in categories:
            Category.objects.get_or_create(name=cat_data['name'], defaults=cat_data)
        
        self.stdout.write(f'Created {len(categories)} categories')

    def create_suppliers(self):
        """Create suppliers."""
        from inventory.models import Supplier
        
        suppliers = [
            {
                'name': 'ABC Electronics Ltd',
                'contact_person': 'Suresh Gupta',
                'email': 'suresh@abcelectronics.com',
                'phone': '9811111111',
                'address': '123 Industrial Area',
                'city': 'Delhi',
                'state': 'Delhi',
                'pincode': '110001',
                'gst_number': '07AAACB1234F1ZV',
            },
            {
                'name': 'Fresh Foods India',
                'contact_person': 'Anita Reddy',
                'email': 'anita@freshfoods.com',
                'phone': '9822222222',
                'address': '456 Market Street',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'pincode': '400001',
                'gst_number': '27AABCF5678G1ZK',
            },
            {
                'name': 'Style Garments',
                'contact_person': 'Mohammad Khan',
                'email': 'khan@stylegarments.com',
                'phone': '9833333333',
                'address': '789 Textile Hub',
                'city': 'Surat',
                'state': 'Gujarat',
                'pincode': '395001',
                'gst_number': '24AADCS9012H1ZL',
            },
            {
                'name': 'Kitchen World',
                'contact_person': 'Lakshmi Iyer',
                'email': 'lakshmi@kitchenworld.com',
                'phone': '9844444444',
                'address': '321 Commerce Center',
                'city': 'Chennai',
                'state': 'Tamil Nadu',
                'pincode': '600001',
                'gst_number': '33AABCK3456I1ZM',
            },
            {
                'name': 'Beauty Plus',
                'contact_person': 'Pooja Mehta',
                'email': 'pooja@beautyplus.com',
                'phone': '9855555555',
                'address': '654 Beauty Lane',
                'city': 'Bangalore',
                'state': 'Karnataka',
                'pincode': '560001',
                'gst_number': '29AADCB7890J1ZN',
            },
        ]
        
        for sup_data in suppliers:
            Supplier.objects.get_or_create(name=sup_data['name'], defaults=sup_data)
        
        self.stdout.write(f'Created {len(suppliers)} suppliers')

    def create_products(self):
        """Create products."""
        from inventory.models import Product, Category, Supplier
        
        categories = {cat.name: cat for cat in Category.objects.all()}
        suppliers = list(Supplier.objects.all())
        
        products_data = [
            # Electronics
            {'name': 'Wireless Earbuds Pro', 'category': 'Electronics', 'cost_price': 800, 'selling_price': 1499, 'stock': 45, 'barcode': 'ELE001'},
            {'name': 'Bluetooth Speaker 10W', 'category': 'Electronics', 'cost_price': 600, 'selling_price': 1199, 'stock': 30, 'barcode': 'ELE002'},
            {'name': 'USB-C Fast Charger', 'category': 'Electronics', 'cost_price': 200, 'selling_price': 499, 'stock': 100, 'barcode': 'ELE003'},
            {'name': 'Power Bank 10000mAh', 'category': 'Electronics', 'cost_price': 500, 'selling_price': 999, 'stock': 55, 'barcode': 'ELE004'},
            {'name': 'Wireless Mouse', 'category': 'Electronics', 'cost_price': 300, 'selling_price': 599, 'stock': 70, 'barcode': 'ELE005'},
            {'name': 'LED Desk Lamp', 'category': 'Electronics', 'cost_price': 400, 'selling_price': 799, 'stock': 25, 'barcode': 'ELE006'},
            
            # Groceries
            {'name': 'Basmati Rice 5kg', 'category': 'Groceries', 'cost_price': 350, 'selling_price': 450, 'stock': 80, 'barcode': 'GRO001', 'gst_rate': 5},
            {'name': 'Wheat Flour 10kg', 'category': 'Groceries', 'cost_price': 400, 'selling_price': 520, 'stock': 60, 'barcode': 'GRO002', 'gst_rate': 5},
            {'name': 'Cooking Oil 5L', 'category': 'Groceries', 'cost_price': 600, 'selling_price': 750, 'stock': 50, 'barcode': 'GRO003', 'gst_rate': 5},
            {'name': 'Sugar 5kg', 'category': 'Groceries', 'cost_price': 200, 'selling_price': 260, 'stock': 90, 'barcode': 'GRO004', 'gst_rate': 5},
            {'name': 'Salt 1kg', 'category': 'Groceries', 'cost_price': 15, 'selling_price': 25, 'stock': 150, 'barcode': 'GRO005', 'gst_rate': 5},
            {'name': 'Tea 500g', 'category': 'Groceries', 'cost_price': 150, 'selling_price': 220, 'stock': 100, 'barcode': 'GRO006', 'gst_rate': 5},
            {'name': 'Coffee Powder 200g', 'category': 'Groceries', 'cost_price': 180, 'selling_price': 280, 'stock': 70, 'barcode': 'GRO007', 'gst_rate': 5},
            {'name': 'Honey 500g', 'category': 'Groceries', 'cost_price': 200, 'selling_price': 320, 'stock': 40, 'barcode': 'GRO008', 'gst_rate': 5},
            
            # Clothing
            {'name': 'Cotton T-Shirt Men', 'category': 'Clothing', 'cost_price': 200, 'selling_price': 499, 'stock': 120, 'barcode': 'CLO001'},
            {'name': 'Denim Jeans Men', 'category': 'Clothing', 'cost_price': 500, 'selling_price': 1299, 'stock': 60, 'barcode': 'CLO002'},
            {'name': 'Formal Shirt Men', 'category': 'Clothing', 'cost_price': 350, 'selling_price': 899, 'stock': 80, 'barcode': 'CLO003'},
            {'name': 'Kurti Women', 'category': 'Clothing', 'cost_price': 300, 'selling_price': 699, 'stock': 90, 'barcode': 'CLO004'},
            {'name': 'Saree Cotton', 'category': 'Clothing', 'cost_price': 600, 'selling_price': 1499, 'stock': 40, 'barcode': 'CLO005'},
            {'name': 'Kids T-Shirt', 'category': 'Clothing', 'cost_price': 150, 'selling_price': 349, 'stock': 100, 'barcode': 'CLO006'},
            
            # Home & Kitchen
            {'name': 'Non-Stick Pan Set', 'category': 'Home & Kitchen', 'cost_price': 800, 'selling_price': 1599, 'stock': 25, 'barcode': 'HOM001'},
            {'name': 'Pressure Cooker 5L', 'category': 'Home & Kitchen', 'cost_price': 1000, 'selling_price': 1999, 'stock': 30, 'barcode': 'HOM002'},
            {'name': 'Dinner Set 24pc', 'category': 'Home & Kitchen', 'cost_price': 1200, 'selling_price': 2499, 'stock': 15, 'barcode': 'HOM003'},
            {'name': 'Water Bottle Steel', 'category': 'Home & Kitchen', 'cost_price': 200, 'selling_price': 449, 'stock': 80, 'barcode': 'HOM004'},
            {'name': 'Food Container Set', 'category': 'Home & Kitchen', 'cost_price': 300, 'selling_price': 599, 'stock': 60, 'barcode': 'HOM005'},
            {'name': 'Mixer Grinder', 'category': 'Home & Kitchen', 'cost_price': 1500, 'selling_price': 2999, 'stock': 20, 'barcode': 'HOM006'},
            
            # Beauty & Personal Care
            {'name': 'Face Wash 100ml', 'category': 'Beauty & Personal Care', 'cost_price': 80, 'selling_price': 150, 'stock': 100, 'barcode': 'BEA001'},
            {'name': 'Shampoo 400ml', 'category': 'Beauty & Personal Care', 'cost_price': 150, 'selling_price': 299, 'stock': 80, 'barcode': 'BEA002'},
            {'name': 'Body Lotion 200ml', 'category': 'Beauty & Personal Care', 'cost_price': 120, 'selling_price': 249, 'stock': 70, 'barcode': 'BEA003'},
            {'name': 'Sunscreen SPF50', 'category': 'Beauty & Personal Care', 'cost_price': 200, 'selling_price': 399, 'stock': 50, 'barcode': 'BEA004'},
            {'name': 'Hair Oil 200ml', 'category': 'Beauty & Personal Care', 'cost_price': 100, 'selling_price': 199, 'stock': 90, 'barcode': 'BEA005'},
            {'name': 'Perfume 100ml', 'category': 'Beauty & Personal Care', 'cost_price': 500, 'selling_price': 999, 'stock': 35, 'barcode': 'BEA006'},
            
            # Sports & Fitness
            {'name': 'Yoga Mat', 'category': 'Sports & Fitness', 'cost_price': 300, 'selling_price': 599, 'stock': 40, 'barcode': 'SPO001'},
            {'name': 'Dumbbells 5kg Pair', 'category': 'Sports & Fitness', 'cost_price': 400, 'selling_price': 799, 'stock': 30, 'barcode': 'SPO002'},
            {'name': 'Skipping Rope', 'category': 'Sports & Fitness', 'cost_price': 100, 'selling_price': 249, 'stock': 60, 'barcode': 'SPO003'},
            {'name': 'Cricket Ball', 'category': 'Sports & Fitness', 'cost_price': 150, 'selling_price': 299, 'stock': 80, 'barcode': 'SPO004'},
            {'name': 'Badminton Racket', 'category': 'Sports & Fitness', 'cost_price': 350, 'selling_price': 699, 'stock': 25, 'barcode': 'SPO005'},
            {'name': 'Football Size 5', 'category': 'Sports & Fitness', 'cost_price': 400, 'selling_price': 799, 'stock': 20, 'barcode': 'SPO006'},
            
            # Books & Stationery
            {'name': 'Notebook 200 Pages', 'category': 'Books & Stationery', 'cost_price': 40, 'selling_price': 80, 'stock': 200, 'barcode': 'BOO001', 'gst_rate': 5},
            {'name': 'Pen Set 10pc', 'category': 'Books & Stationery', 'cost_price': 50, 'selling_price': 99, 'stock': 150, 'barcode': 'BOO002', 'gst_rate': 5},
            {'name': 'Geometry Box', 'category': 'Books & Stationery', 'cost_price': 80, 'selling_price': 149, 'stock': 100, 'barcode': 'BOO003', 'gst_rate': 5},
            {'name': 'Dictionary English', 'category': 'Books & Stationery', 'cost_price': 150, 'selling_price': 299, 'stock': 40, 'barcode': 'BOO004', 'gst_rate': 5},
            {'name': 'Drawing Book A4', 'category': 'Books & Stationery', 'cost_price': 60, 'selling_price': 120, 'stock': 80, 'barcode': 'BOO005', 'gst_rate': 5},
            
            # Toys & Games
            {'name': 'Building Blocks Set', 'category': 'Toys & Games', 'cost_price': 300, 'selling_price': 599, 'stock': 35, 'barcode': 'TOY001'},
            {'name': 'Remote Control Car', 'category': 'Toys & Games', 'cost_price': 500, 'selling_price': 999, 'stock': 20, 'barcode': 'TOY002'},
            {'name': 'Board Game Classic', 'category': 'Toys & Games', 'cost_price': 250, 'selling_price': 499, 'stock': 30, 'barcode': 'TOY003'},
            {'name': 'Soft Toy Bear', 'category': 'Toys & Games', 'cost_price': 200, 'selling_price': 399, 'stock': 45, 'barcode': 'TOY004'},
            {'name': 'Puzzle 500 Pieces', 'category': 'Toys & Games', 'cost_price': 150, 'selling_price': 299, 'stock': 40, 'barcode': 'TOY005'},
            
            # Health & Wellness
            {'name': 'Multivitamin 60 Tablets', 'category': 'Health & Wellness', 'cost_price': 200, 'selling_price': 399, 'stock': 60, 'barcode': 'HEA001', 'gst_rate': 12},
            {'name': 'Protein Powder 1kg', 'category': 'Health & Wellness', 'cost_price': 1200, 'selling_price': 2199, 'stock': 25, 'barcode': 'HEA002', 'gst_rate': 12},
            {'name': 'Hand Sanitizer 500ml', 'category': 'Health & Wellness', 'cost_price': 100, 'selling_price': 199, 'stock': 100, 'barcode': 'HEA003', 'gst_rate': 12},
            {'name': 'First Aid Kit', 'category': 'Health & Wellness', 'cost_price': 300, 'selling_price': 599, 'stock': 30, 'barcode': 'HEA004', 'gst_rate': 12},
            
            # Beverages
            {'name': 'Green Tea 100 Bags', 'category': 'Beverages', 'cost_price': 180, 'selling_price': 349, 'stock': 50, 'barcode': 'BEV001', 'gst_rate': 12},
            {'name': 'Instant Coffee 200g', 'category': 'Beverages', 'cost_price': 250, 'selling_price': 449, 'stock': 60, 'barcode': 'BEV002', 'gst_rate': 12},
            {'name': 'Fruit Juice 1L', 'category': 'Beverages', 'cost_price': 80, 'selling_price': 150, 'stock': 80, 'barcode': 'BEV003', 'gst_rate': 12},
            {'name': 'Energy Drink 250ml', 'category': 'Beverages', 'cost_price': 50, 'selling_price': 99, 'stock': 100, 'barcode': 'BEV004', 'gst_rate': 12},
        ]
        
        for prod_data in products_data:
            category = categories.get(prod_data.pop('category'))
            supplier = random.choice(suppliers) if suppliers else None
            stock = prod_data.pop('stock')
            gst_rate = prod_data.pop('gst_rate', 18)
            
            product, created = Product.objects.get_or_create(
                barcode=prod_data['barcode'],
                defaults={
                    **prod_data,
                    'category': category,
                    'supplier': supplier,
                    'current_stock': stock,
                    'min_stock_level': 10,
                    'gst_rate': gst_rate,
                }
            )
        
        self.stdout.write(f'Created {len(products_data)} products')

    def create_customers(self):
        """Create customers."""
        from crm.models import Customer
        
        customers_data = [
            {'name': 'Vikram Malhotra', 'phone': '9900000001', 'email': 'vikram.m@email.com', 'customer_type': 'retail', 'city': 'Delhi'},
            {'name': 'Sunita Agarwal', 'phone': '9900000002', 'email': 'sunita.a@email.com', 'customer_type': 'retail', 'city': 'Mumbai'},
            {'name': 'Ramesh Trading Co', 'phone': '9900000003', 'email': 'ramesh.trading@email.com', 'customer_type': 'wholesale', 'company_name': 'Ramesh Trading Co', 'city': 'Chennai'},
            {'name': 'Kavitha Reddy', 'phone': '9900000004', 'email': 'kavitha.r@email.com', 'customer_type': 'retail', 'city': 'Hyderabad'},
            {'name': 'Global Enterprises', 'phone': '9900000005', 'email': 'global.ent@email.com', 'customer_type': 'corporate', 'company_name': 'Global Enterprises Ltd', 'city': 'Bangalore'},
            {'name': 'Deepak Sharma', 'phone': '9900000006', 'email': 'deepak.s@email.com', 'customer_type': 'retail', 'city': 'Jaipur'},
            {'name': 'Lakshmi Stores', 'phone': '9900000007', 'email': 'lakshmi.stores@email.com', 'customer_type': 'wholesale', 'company_name': 'Lakshmi Stores', 'city': 'Coimbatore'},
            {'name': 'Arjun Kapoor', 'phone': '9900000008', 'email': 'arjun.k@email.com', 'customer_type': 'retail', 'city': 'Pune'},
            {'name': 'Meera Fashions', 'phone': '9900000009', 'email': 'meera.fashions@email.com', 'customer_type': 'wholesale', 'company_name': 'Meera Fashions', 'city': 'Surat'},
            {'name': 'TechCorp India', 'phone': '9900000010', 'email': 'techcorp@email.com', 'customer_type': 'corporate', 'company_name': 'TechCorp India Pvt Ltd', 'city': 'Gurgaon'},
            {'name': 'Ananya Iyer', 'phone': '9900000011', 'email': 'ananya.i@email.com', 'customer_type': 'retail', 'city': 'Kochi'},
            {'name': 'Krishna Distributors', 'phone': '9900000012', 'email': 'krishna.dist@email.com', 'customer_type': 'wholesale', 'company_name': 'Krishna Distributors', 'city': 'Ahmedabad'},
            {'name': 'Priya Nair', 'phone': '9900000013', 'email': 'priya.n@email.com', 'customer_type': 'retail', 'city': 'Trivandrum'},
            {'name': 'Metro Supplies', 'phone': '9900000014', 'email': 'metro.sup@email.com', 'customer_type': 'corporate', 'company_name': 'Metro Supplies Corp', 'city': 'Kolkata'},
            {'name': 'Sanjay Gupta', 'phone': '9900000015', 'email': 'sanjay.g@email.com', 'customer_type': 'retail', 'city': 'Lucknow'},
            {'name': 'City Mart', 'phone': '9900000016', 'email': 'citymart@email.com', 'customer_type': 'wholesale', 'company_name': 'City Mart', 'city': 'Nagpur'},
            {'name': 'Rohit Verma', 'phone': '9900000017', 'email': 'rohit.v@email.com', 'customer_type': 'retail', 'city': 'Chandigarh'},
        ]
        
        for cust_data in customers_data:
            Customer.objects.get_or_create(phone=cust_data['phone'], defaults=cust_data)
        
        self.stdout.write(f'Created {len(customers_data)} customers')

    def create_invoices(self):
        """Create invoices with items for the past 3 months."""
        from sales.models import Invoice, InvoiceItem, Payment
        from inventory.models import Product, StockTransaction
        from crm.models import Customer
        from staff.models import User
        
        customers = list(Customer.objects.all())
        products = list(Product.objects.filter(is_active=True))
        staff = list(User.objects.filter(role__in=['manager', 'cashier']))
        
        if not staff:
            staff = [User.objects.first()]
        
        payment_methods = ['cash', 'card', 'upi', 'bank_transfer']
        
        # Generate invoices for the past 90 days
        today = timezone.now().date()
        
        invoices_created = 0
        
        for days_ago in range(90, -1, -1):
            invoice_date = today - timedelta(days=days_ago)
            
            # 2-5 invoices per day
            num_invoices = random.randint(2, 5)
            
            for _ in range(num_invoices):
                customer = random.choice(customers) if random.random() > 0.3 else None
                created_by = random.choice(staff)
                payment_method = random.choice(payment_methods)
                
                invoice = Invoice.objects.create(
                    customer=customer,
                    payment_method=payment_method,
                    notes=f'Sale on {invoice_date}',
                    created_by=created_by,
                )
                
                # Override the auto-created date
                Invoice.objects.filter(pk=invoice.pk).update(
                    invoice_date=invoice_date,
                    created_at=timezone.make_aware(
                        timezone.datetime.combine(invoice_date, timezone.datetime.now().time())
                    )
                )
                
                # Add 1-5 items per invoice
                num_items = random.randint(1, 5)
                selected_products = random.sample(products, min(num_items, len(products)))
                
                for product in selected_products:
                    quantity = random.randint(1, 3)
                    
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        product=product,
                        product_name=product.name,
                        product_sku=product.sku,
                        quantity=quantity,
                        unit_price=product.selling_price,
                        discount=random.choice([0, 0, 0, 10, 20, 50]),
                        tax_rate=product.gst_rate,
                    )
                
                # Calculate totals
                invoice.calculate_totals()
                
                # 90% invoices are fully paid
                if random.random() < 0.9:
                    invoice.paid_amount = invoice.total_amount
                    invoice.payment_status = 'paid'
                    invoice.save()
                    
                    Payment.objects.create(
                        invoice=invoice,
                        amount=invoice.total_amount,
                        payment_method=payment_method,
                        received_by=created_by,
                    )
                elif random.random() < 0.5:
                    # Partial payment
                    partial = invoice.total_amount * Decimal(str(random.uniform(0.3, 0.7)))
                    invoice.paid_amount = partial
                    invoice.payment_status = 'partial'
                    invoice.save()
                    
                    Payment.objects.create(
                        invoice=invoice,
                        amount=partial,
                        payment_method=payment_method,
                        received_by=created_by,
                    )
                
                invoices_created += 1
        
        self.stdout.write(f'Created {invoices_created} invoices')
        
        # Update customer stats
        for customer in customers:
            customer.update_stats()
