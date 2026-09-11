"""
Management command to load comprehensive mock data for the BMS system.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, datetime
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
        self.create_departments()
        self.create_products()
        self.create_customers()
        self.create_invoices()
        
        # Clear all relevant caches to ensure fresh data
        self.clear_all_caches()
        
        self.stdout.write(self.style.SUCCESS('Successfully loaded all mock data!'))

    def clear_all_caches(self):
        """Clear all application caches to ensure fresh data."""
        from django.core.cache import cache
        
        cache_keys = [
            'categories_list',
            'suppliers_list', 
            'departments_list',
            'products_list',
            'inventory_stats',
            'staff_stats',
        ]
        
        for key in cache_keys:
            cache.delete(key)
        
        self.stdout.write('Cleared all application caches')

    def create_users(self):
        """Create demo users."""
        from staff.models import User
        
        users_data = [
            {
                'email': 'admin@oaknore.in',
                'password': 'O$1234567890',
                'first_name': 'Rajesh',
                'last_name': 'Kumar',
                'role': 'owner',
                'phone': '9876543210',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'harvansh@oaknore.in',
                'password': 'O$1234567890',
                'first_name': 'Harvansh',
                'last_name': 'Kumar',
                'role': 'manager',
                'phone': '6396003413',
            },
            {
                'email': 'inventory@oaknore.in',
                'password': 'O$1234567890',
                'first_name': 'Inventory',
                'last_name': 'Null',
                'role': 'cashier',          # worker || cashier || Manager
                'phone': '9876543212',
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
        """Create product categories with cache invalidation."""
        from inventory.models import Category
        from django.core.cache import cache
        
        categories = [
            {'name': 'Plywood & Boards', 'description': 'Plywood, MDF, laminates, and engineered wood boards'},
            {'name': 'Paints & Finishes', 'description': 'Paints, primers, thinners, polish, and finishing materials'},
            {'name': 'Stone & Polishing', 'description': 'Natural stone, abrasives, sealers, and polishing consumables'},
            {'name': 'Carpentry Hardware', 'description': 'Adhesives, fasteners, hinges, handles, and woodworking supplies'},
            {'name': 'Metal & Fabrication', 'description': 'Metal sheets, tubes, rods, welding, and fabrication consumables'},
            {'name': 'Electroplating Supplies', 'description': 'Plating chemicals, anodes, cleaners, and process consumables'},
            {'name': 'Upholstery Materials', 'description': 'Foam, fabric, leatherette, thread, and upholstery accessories'},
            {'name': 'Electrical & Safety', 'description': 'Electrical fittings, cables, PPE, and workshop safety supplies'},
        ]
        
        for cat_data in categories:
            Category.objects.get_or_create(name=cat_data['name'], defaults=cat_data)
        
        # Clear categories cache
        cache.delete('categories_list')
        
        self.stdout.write(f'Created {len(categories)} categories')

    def create_suppliers(self):
        """Create suppliers with cache invalidation."""
        from inventory.models import Supplier
        from django.core.cache import cache
        
        suppliers = [
            {'name': 'National Board & Plywood Supply', 'contact_person': 'Suresh Gupta', 'email': 'suresh@nationalboards.example.com', 'phone': '9811111111', 'address': '123 Industrial Area', 'city': 'Bengaluru', 'state': 'Karnataka', 'pincode': '560001', 'gst_number': '29AAACB1234F1ZV'},
            {'name': 'Spectrum Paints & Coatings', 'contact_person': 'Anita Reddy', 'email': 'anita@spectrumpaints.example.com', 'phone': '9822222222', 'address': '456 Industrial Estate', 'city': 'Hyderabad', 'state': 'Telangana', 'pincode': '500001', 'gst_number': '36AABCF5678G1ZK'},
            {'name': 'Granite & Stone Processors', 'contact_person': 'Mohammad Khan', 'email': 'khan@graniteprocessors.example.com', 'phone': '9833333333', 'address': '789 Stone Market', 'city': 'Udaipur', 'state': 'Rajasthan', 'pincode': '313001', 'gst_number': '08AADCS9012H1ZL'},
            {'name': 'ProCut Carpentry Hardware', 'contact_person': 'Lakshmi Iyer', 'email': 'lakshmi@procut.example.com', 'phone': '9844444444', 'address': '321 Furniture Cluster', 'city': 'Chennai', 'state': 'Tamil Nadu', 'pincode': '600001', 'gst_number': '33AABCK3456I1ZM'},
            {'name': 'Apex Metals & Welding', 'contact_person': 'Pooja Mehta', 'email': 'pooja@apexmetals.example.com', 'phone': '9855555555', 'address': '654 Fabrication Road', 'city': 'Pune', 'state': 'Maharashtra', 'pincode': '411001', 'gst_number': '27AADCB7890J1ZN'},
            {'name': 'BrightPlate Chemicals', 'contact_person': 'Nitin Shah', 'email': 'nitin@brightplate.example.com', 'phone': '9866666666', 'address': '18 Chemical Industrial Zone', 'city': 'Ahmedabad', 'state': 'Gujarat', 'pincode': '380001', 'gst_number': '24AABCB2468K1ZP'},
            {'name': 'ComfortFoam Upholstery Supply', 'contact_person': 'Meena Nair', 'email': 'meena@comfortfoam.example.com', 'phone': '9877777777', 'address': '42 Textile and Furniture Park', 'city': 'Kochi', 'state': 'Kerala', 'pincode': '682001', 'gst_number': '32AABCC1357L1ZT'},
        ]
        
        for sup_data in suppliers:
            Supplier.objects.get_or_create(name=sup_data['name'], defaults=sup_data)
        
        # Clear suppliers cache
        cache.delete('suppliers_list')
        
        self.stdout.write(f'Created {len(suppliers)} suppliers')

    def create_departments(self):
        """Create departments with optimized DB queries and cache invalidation."""
        from inventory.models import Department
        from django.core.cache import cache
        
        departments = [
            {
                'name': 'Carpentry',
                'code': 'CARP',
                'description': 'Custom woodwork, furniture manufacturing, repairs, and finishing.'
            },
            {
                'name': 'Design',
                'code': 'DSGN',
                'description': 'Creates visual concepts, user experiences, and aesthetic standards that shape products, brands, and communications.'
            },
            {
                'name': 'Metal',
                'code': 'METL',
                'description': 'Fabrication, welding, shaping, and finishing of metal components and structures'
            },
            {
                'name': 'Polishing',
                'code': 'POLI',
                'description': 'Surface finishing, buffing, and restoration to achieve a smooth, refined appearance.'
            },
            {
                'name': 'Stone',
                'code': 'STON',
                'description': 'Cutting, shaping, installation, and finishing of marble, granite, and other stones.'
            },
            {
                'name': 'Upholstry',
                'code': 'UPHO',
                'description': 'Furniture cushioning, fabric/leather fitting, repair, and reupholstering.'
            },
        ]
        
        # Use bulk_create with get_or_create pattern for better performance
        created_count = 0
        for dept_data in departments:
            department, created = Department.objects.get_or_create(
                code=dept_data['code'],
                defaults=dept_data
            )
            if created:
                created_count += 1
                self.stdout.write(f'Created department: {department.name}')
            else:
                # Update description if department exists but might have different description
                if department.description != dept_data['description']:
                    department.description = dept_data['description']
                    department.save()
                    self.stdout.write(f'Updated department: {department.name}')
                else:
                    self.stdout.write(f'Department already exists: {department.name}')
        
        # Clear the departments cache to ensure API returns fresh data
        cache.delete('departments_list')
        self.stdout.write('Cleared departments cache')
        
        self.stdout.write(f'Created {created_count} new departments')

    def create_products(self):
        """Create manufacturing raw materials and workshop consumables with cache invalidation."""
        from inventory.models import Product, Category, Supplier
        from django.core.cache import cache
        
        categories = {cat.name: cat for cat in Category.objects.all()}
        suppliers = list(Supplier.objects.all())
        
        products_data = [
            {'name': 'Commercial Plywood 8mm', 'tally_name': '','category': 'Plywood & Boards', 'cost_price': 1450,  'stock': 28, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '441231'},
            {'name': 'BWP Marine Plywood 18mm', 'tally_name': '','category': 'Plywood & Boards', 'cost_price': 2850,  'stock': 18, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '441231'},
            {'name': 'MDF Board 12mm', 'tally_name': '','category': 'Plywood & Boards', 'cost_price': 920,  'stock': 35, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '441114'},
            {'name': 'Decorative Laminate Sheet', 'tally_name': '','category': 'Plywood & Boards', 'cost_price': 480, 'stock': 60, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '482390'},
            {'name': 'PU Wood Primer 20L', 'tally_name': '','category': 'Paints & Finishes', 'cost_price': 4200,  'stock': 12, 'unit': 'box', 'gst_rate': 18, 'hsn_code': '320810'},
            {'name': 'PU Top Coat Clear 20L', 'tally_name': '','category': 'Paints & Finishes', 'cost_price': 5600,  'stock': 9, 'unit': 'box', 'gst_rate': 18, 'hsn_code': '320810'},
            {'name': 'NC Sanding Sealer 20L', 'tally_name': '','category': 'Paints & Finishes', 'cost_price': 3100,  'stock': 15, 'unit': 'box', 'gst_rate': 18, 'hsn_code': '320890'},
            {'name': 'Thinner 5L', 'tally_name': '','category': 'Paints & Finishes', 'cost_price': 650, 'stock': 42, 'unit': 'l', 'gst_rate': 18, 'hsn_code': '381400'},
            {'name': 'Black Granite Slab 20mm', 'tally_name': '','category': 'Stone & Polishing', 'cost_price': 3200,  'stock': 16, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '680293'},
            {'name': 'White Marble Slab 18mm', 'tally_name': '','category': 'Stone & Polishing', 'cost_price': 4100,  'stock': 14, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '680221'},
            {'name': 'Diamond Polishing Pad 4in', 'tally_name': '','category': 'Stone & Polishing', 'cost_price': 280, 'stock': 75, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '680421'},
            {'name': 'Stone Sealer 5L', 'tally_name': '','category': 'Stone & Polishing', 'cost_price': 1550,  'stock': 20, 'unit': 'l', 'gst_rate': 18, 'hsn_code': '321490'},
            {'name': 'Wood Adhesive 5kg', 'tally_name': '','category': 'Carpentry Hardware', 'cost_price': 620, 'stock': 35, 'unit': 'kg', 'gst_rate': 18, 'hsn_code': '350699'},
            {'name': 'Soft Close Hinge Pair', 'tally_name': '','category': 'Carpentry Hardware', 'cost_price': 95, 'stock': 240, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '830210'},
            {'name': 'Tandem Drawer Channel 450mm', 'tally_name': '','category': 'Carpentry Hardware', 'cost_price': 340, 'stock': 80, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '830242'},
            {'name': 'Wood Screw Assorted Box', 'tally_name': '','category': 'Carpentry Hardware', 'cost_price': 420, 'stock': 45, 'unit': 'box', 'gst_rate': 18, 'hsn_code': '731812'},
            {'name': 'MS Square Tube 25x25mm', 'tally_name': '','category': 'Metal & Fabrication', 'cost_price': 92, 'stock': 350, 'unit': 'm', 'gst_rate': 18, 'hsn_code': '730661'},
            {'name': 'SS 304 Sheet 1.5mm', 'tally_name': '','category': 'Metal & Fabrication', 'cost_price': 6800,  'stock': 22, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '721933'},
            {'name': 'MIG Welding Wire 0.8mm', 'tally_name': '','category': 'Metal & Fabrication', 'cost_price': 760, 'stock': 30, 'unit': 'kg', 'gst_rate': 18, 'hsn_code': '831130'},
            {'name': 'Cutting Disc 4in', 'tally_name': '','category': 'Metal & Fabrication', 'cost_price': 38, 'stock': 180, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '680422'},
            {'name': 'Nickel Sulphate Plating Grade', 'tally_name': '','category': 'Electroplating Supplies', 'cost_price': 680, 'stock': 90, 'unit': 'kg', 'gst_rate': 18, 'hsn_code': '283324'},
            {'name': 'Copper Sulphate Plating Grade', 'tally_name': '','category': 'Electroplating Supplies', 'cost_price': 410, 'stock': 75, 'unit': 'kg', 'gst_rate': 18, 'hsn_code': '283325'},
            {'name': 'Electroplating Degreaser', 'tally_name': '','category': 'Electroplating Supplies', 'cost_price': 290, 'stock': 50, 'unit': 'kg', 'gst_rate': 18, 'hsn_code': '340290'},
            {'name': 'Nickel Anode Plate', 'tally_name': '','category': 'Electroplating Supplies', 'cost_price': 1850,  'stock': 24, 'unit': 'kg', 'gst_rate': 18, 'hsn_code': '750210'},
            {'name': 'High Density Foam 4in', 'tally_name': '','category': 'Upholstery Materials', 'cost_price': 2100,  'stock': 25, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '940490'},
            {'name': 'Furniture Fabric Charcoal', 'tally_name': '','category': 'Upholstery Materials', 'cost_price': 480, 'stock': 120, 'unit': 'm', 'gst_rate': 5, 'hsn_code': '551219'},
            {'name': 'Synthetic Leather Roll', 'tally_name': '','category': 'Upholstery Materials', 'cost_price': 290, 'stock': 85, 'unit': 'm', 'gst_rate': 18, 'hsn_code': '590310'},
            {'name': 'Upholstery Thread 500g', 'tally_name': '','category': 'Upholstery Materials', 'cost_price': 180, 'stock': 65, 'unit': 'pcs', 'gst_rate': 5, 'hsn_code': '550810'},
            {'name': 'Flexible Copper Cable 2.5mm', 'tally_name': '','category': 'Electrical & Safety', 'cost_price': 78, 'stock': 420, 'unit': 'm', 'gst_rate': 18, 'hsn_code': '854449'},
            {'name': 'Industrial LED Work Light', 'tally_name': '','category': 'Electrical & Safety', 'cost_price': 1250,  'stock': 18, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '940540'},
            {'name': 'Nitrile Safety Gloves Pair', 'tally_name': '','category': 'Electrical & Safety', 'cost_price': 35, 'stock': 250, 'unit': 'pcs', 'gst_rate': 5, 'hsn_code': '401519'},
            {'name': 'Respirator Mask Filter', 'tally_name': '','category': 'Electrical & Safety', 'cost_price': 220, 'stock': 40, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '902000'},
            {'name': 'Fevicol SH Wood Adhesive 5kg', 'tally_name': '','category': 'Adhesives & Chemicals', 'cost_price': 720, 'stock': 40, 'unit': 'kg', 'gst_rate': 18, 'hsn_code': '350610'},
            {'name': 'Epoxy Resin 20kg', 'tally_name': '','category': 'Adhesives & Chemicals', 'cost_price': 4200,  'stock': 15, 'unit': 'box', 'gst_rate': 18, 'hsn_code': '390730'},
            {'name': 'Hardener Chemical 5kg', 'tally_name': '','category': 'Adhesives & Chemicals', 'cost_price': 1450,  'stock': 25, 'unit': 'kg', 'gst_rate': 18, 'hsn_code': '292130'},
            {'name': 'Abrasive Sandpaper 120 Grit', 'tally_name': '','category': 'Abrasives & Consumables', 'cost_price': 18, 'stock': 500, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '680520'},
            {'name': 'Abrasive Sandpaper 320 Grit', 'tally_name': '','category': 'Abrasives & Consumables', 'cost_price': 22, 'stock': 450, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '680520'},
            {'name': 'Flap Disc 4in', 'tally_name': '','category': 'Abrasives & Consumables', 'cost_price': 55, 'stock': 180, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '680422'},
            {'name': 'TIG Welding Rod 2.4mm', 'tally_name': '','category': 'Welding Consumables', 'cost_price': 620, 'stock': 35, 'unit': 'kg', 'gst_rate': 18, 'hsn_code': '831110'},
            {'name': 'MIG Welding Wire 1.0mm', 'tally_name': '','category': 'Welding Consumables', 'cost_price': 780, 'stock': 28, 'unit': 'kg', 'gst_rate': 18, 'hsn_code': '831130'},
            {'name': 'Welding Electrode E6013 3.15mm', 'tally_name': '','category': 'Welding Consumables', 'cost_price': 180, 'stock': 100, 'unit': 'kg', 'gst_rate': 18, 'hsn_code': '831110'},
            {'name': 'GI Sheet 1mm', 'tally_name': '','category': 'Metal & Fabrication', 'cost_price': 2850,  'stock': 30, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '721049'},
            {'name': 'MS Round Bar 12mm', 'tally_name': '','category': 'Metal & Fabrication', 'cost_price': 68, 'stock': 250, 'unit': 'm', 'gst_rate': 18, 'hsn_code': '721499'},
            {'name': 'Aluminium Sheet 2mm', 'tally_name': '','category': 'Metal & Fabrication', 'cost_price': 4200,  'stock': 20, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '760612'},
            {'name': 'PVC Edge Band 22mm', 'tally_name': '','category': 'Furniture Components', 'cost_price': 42, 'stock': 300, 'unit': 'm', 'gst_rate': 18, 'hsn_code': '392049'},
            {'name': 'ABS Edge Band 2mm', 'tally_name': '','category': 'Furniture Components', 'cost_price': 58, 'stock': 220, 'unit': 'm', 'gst_rate': 18, 'hsn_code': '392030'},
            {'name': 'Drawer Lock Small', 'tally_name': '','category': 'Furniture Components', 'cost_price': 38, 'stock': 180, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '830130'},
            {'name': 'Cabinet Handle 128mm', 'tally_name': '','category': 'Furniture Components', 'cost_price': 75, 'stock': 150, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '830242'},
            {'name': 'Hydraulic Cabinet Gas Lift', 'tally_name': '','category': 'Furniture Components', 'cost_price': 110, 'stock': 100, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '830242'},
            {'name': 'PU Foam Adhesive Spray', 'tally_name': '','category': 'Adhesives & Chemicals', 'cost_price': 380, 'stock': 45, 'unit': 'pcs', 'gst_rate': 18, 'hsn_code': '350610'},
            {'name': 'Wood Filler White 1kg', 'tally_name': '','category': 'Paints & Finishes', 'cost_price': 180, 'stock': 60, 'unit': 'kg', 'gst_rate': 18, 'hsn_code': '321410'},
            {'name': 'Melamine Polish 5L', 'tally_name': '','category': 'Paints & Finishes', 'cost_price': 950,  'stock': 30, 'unit': 'l', 'gst_rate': 18, 'hsn_code': '320890'},
            {'name': 'PU Thinner 20L', 'tally_name': '','category': 'Paints & Finishes', 'cost_price': 2100,  'stock': 18, 'unit': 'box', 'gst_rate': 18, 'hsn_code': '381400'},
        ]
        
        for prod_data in products_data:
            category_name = prod_data.pop('category')
            category = categories.get(category_name)

            supplier = random.choice(suppliers) if suppliers else None
            stock = prod_data.pop('stock')
            gst_rate = prod_data.pop('gst_rate', 18)

            product, created = Product.objects.get_or_create(
                name=prod_data['name'],
                defaults={
                    **prod_data,
                    'category': category,
                    'supplier': supplier,
                    'current_stock': stock,
                    'min_stock_level': 10,
                    'max_stock_level': 1000,
                    'gst_rate': gst_rate,
                }
            )
        
        # Clear products cache
        cache.delete('products_list')
        cache.delete('inventory_stats')
        
        self.stdout.write(f'Created {len(products_data)} products')

    def create_customers(self):
        """Create customers."""
        from crm.models import Customer
        
        customers_data = [
            {'name': 'Oakline Modular Furniture', 'phone': '9900000001', 'email': 'purchase@oakline.example.com', 'customer_type': 'corporate', 'company_name': 'Oakline Modular Furniture Pvt Ltd', 'city': 'Bengaluru'},
            {'name': 'StoneCraft Surfaces', 'phone': '9900000002', 'email': 'stores@stonecraft.example.com', 'customer_type': 'corporate', 'company_name': 'StoneCraft Surfaces', 'city': 'Udaipur'},
            {'name': 'Urban Kitchen Studio', 'phone': '9900000003', 'email': 'procurement@urbankitchen.example.com', 'customer_type': 'wholesale', 'company_name': 'Urban Kitchen Studio', 'city': 'Chennai'},
            {'name': 'Reddy Interior Works', 'phone': '9900000004', 'email': 'accounts@reddyinterior.example.com', 'customer_type': 'corporate', 'company_name': 'Reddy Interior Works', 'city': 'Hyderabad'},
            {'name': 'MetalForm Engineering', 'phone': '9900000005', 'email': 'purchase@metalform.example.com', 'customer_type': 'corporate', 'company_name': 'MetalForm Engineering Pvt Ltd', 'city': 'Pune'},
            {'name': 'CraftHouse Cabinetry', 'phone': '9900000006', 'email': 'stores@crafthouse.example.com', 'customer_type': 'wholesale', 'company_name': 'CraftHouse Cabinetry', 'city': 'Jaipur'},
            {'name': 'Royal Polish Works', 'phone': '9900000007', 'email': 'admin@royalpolish.example.com', 'customer_type': 'corporate', 'company_name': 'Royal Polish Works', 'city': 'Ahmedabad'},
            {'name': 'FineLine Office Interiors', 'phone': '9900000008', 'email': 'purchase@fineline.example.com', 'customer_type': 'corporate', 'company_name': 'FineLine Office Interiors', 'city': 'Mumbai'},
            {'name': 'Comfort Seating Systems', 'phone': '9900000009', 'email': 'stores@comfortseating.example.com', 'customer_type': 'corporate', 'company_name': 'Comfort Seating Systems', 'city': 'Kochi'},
            {'name': 'Apex Hotel Projects', 'phone': '9900000010', 'email': 'projects@apexhotel.example.com', 'customer_type': 'corporate', 'company_name': 'Apex Hotel Projects Ltd', 'city': 'Gurgaon'},
            {'name': 'HomeGrid Manufacturing', 'phone': '9900000011', 'email': 'purchase@homegrid.example.com', 'customer_type': 'corporate', 'company_name': 'HomeGrid Manufacturing', 'city': 'Coimbatore'},
            {'name': 'BuildRight Contractors', 'phone': '9900000012', 'email': 'materials@buildright.example.com', 'customer_type': 'wholesale', 'company_name': 'BuildRight Contractors', 'city': 'Ahmedabad'},
            {'name': 'NorthStar Furniture Factory', 'phone': '9900000013', 'email': 'purchase@northstar.example.com', 'customer_type': 'corporate', 'company_name': 'NorthStar Furniture Factory', 'city': 'Delhi'},
            {'name': 'Metro Fabrication Unit', 'phone': '9900000014', 'email': 'stores@metrofab.example.com', 'customer_type': 'corporate', 'company_name': 'Metro Fabrication Unit', 'city': 'Kolkata'},
            {'name': 'DecorEdge Designers', 'phone': '9900000015', 'email': 'procurement@decoredge.example.com', 'customer_type': 'wholesale', 'company_name': 'DecorEdge Designers', 'city': 'Lucknow'},
            {'name': 'SouthWood Production House', 'phone': '9900000016', 'email': 'purchase@southwood.example.com', 'customer_type': 'corporate', 'company_name': 'SouthWood Production House', 'city': 'Chennai'},
            {'name': 'Prime Electro Finishers', 'phone': '9900000017', 'email': 'accounts@primefinishers.example.com', 'customer_type': 'corporate', 'company_name': 'Prime Electro Finishers', 'city': 'Chandigarh'},
        ]
        
        for cust_data in customers_data:
            Customer.objects.get_or_create(phone=cust_data['phone'], defaults=cust_data)
        
        self.stdout.write(f'Created {len(customers_data)} customers')

    def create_invoices(self):
        """Create invoices with items for the past 3 months."""
        from sales.models import Invoice, InvoiceItem, Payment
        from inventory.models import Product, StockTransaction, Department
        from crm.models import Customer
        from staff.models import User
        
        customers = list(Customer.objects.all())
        products = list(Product.objects.filter(is_active=True))
        departments = list(Department.objects.filter(is_active=True))
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
                department = random.choice(departments) if departments and random.random() > 0.4 else None
                
                # Generate project name for department invoices
                project_name = ''  # Always provide empty string to avoid NOT NULL constraint
                project_created_by = ''
                if department:
                    project_name = random.choice(['NELSON BED', 'Harper Sofa (Fabric2)', 'NOVA BOOKSHELF', 'RELAX CHAIR', 'NIGHT TABLE', 'LOW CABINET', 'MNZ POUF WITH TRAY', 'BASTIEN BED SIDE NIGHT TABLE'])
                    project_created_by = random.choice(['Nishant Singh', 'Aditi Marchanda', 'Rajender Kumar', 'Bot'])
                
                invoice = Invoice.objects.create(
                    customer=customer,
                    department=department,
                    project_name=project_name,
                    project_created_by=project_created_by,
                    payment_method=payment_method,
                    notes=f'Sale on {invoice_date}',
                    created_by=created_by,
                )
                
                # Override the auto-created date with timezone awareness
                from django.utils.timezone import make_aware
                Invoice.objects.filter(pk=invoice.pk).update(
                    invoice_date=invoice_date,
                    created_at=make_aware(datetime.combine(invoice_date, datetime.now().time()))
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
                        unit_price=product.cost_price,
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
