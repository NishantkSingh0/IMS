"""
Management command to load sample vendors (suppliers) for demos/showcase.

Safe to run multiple times: vendors are matched by name (case-insensitive) and never duplicated or overwritten.
All contact details and GSTINs are fictional.
"""

from django.core.cache import cache
from django.core.management.base import BaseCommand

from inventory.models import Supplier

SAMPLE_VENDORS = [
    {'name': 'Shree Balaji Hardware & Tools', 'contact_person': 'Ramesh Agarwal', 'email': 'sales@shreebalajihardware.example.com', 'phone': '9810011001', 'address': 'Shop 14, Chawri Bazar', 'city': 'Delhi', 'state': 'Delhi', 'pincode': '110006', 'gst_number': '07AAKFS4821M1Z3'},
    {'name': 'Noida Fasteners Pvt Ltd', 'contact_person': 'Vikas Sharma', 'email': 'orders@noidafasteners.example.com', 'phone': '9810011002', 'address': 'C-42, Sector 63', 'city': 'Noida', 'state': 'Uttar Pradesh', 'pincode': '201301', 'gst_number': '09AADCN7314K1Z8'},
    {'name': 'Kirti Plywood Centre', 'contact_person': 'Kirti Jain', 'email': 'kirti@kirtiplywood.example.com', 'phone': '9810011003', 'address': '27, Kirti Nagar Timber Market', 'city': 'Delhi', 'state': 'Delhi', 'pincode': '110015', 'gst_number': '07ABHPJ5528D1ZQ'},
    {'name': 'Ganga Paints & Polishes', 'contact_person': 'Sunil Verma', 'email': 'sunil@gangapaints.example.com', 'phone': '9810011004', 'address': 'Plot 8, Sahibabad Industrial Area', 'city': 'Ghaziabad', 'state': 'Uttar Pradesh', 'pincode': '201010', 'gst_number': '09AAGFG2207B1ZK'},
    {'name': 'Fevi Bond Adhesives Distributors', 'contact_person': 'Manoj Gupta', 'email': 'manoj@fevibonddist.example.com', 'phone': '9810011005', 'address': '112, Naya Bazar', 'city': 'Delhi', 'state': 'Delhi', 'pincode': '110006', 'gst_number': '07AAFCF6639R1ZW'},
    {'name': 'Abrasive Solutions India', 'contact_person': 'Deepak Malhotra', 'email': 'deepak@abrasivesolutions.example.com', 'phone': '9810011006', 'address': 'Sector 24, Faridabad Industrial Area', 'city': 'Faridabad', 'state': 'Haryana', 'pincode': '121005', 'gst_number': '06AAHCA9046P1ZE'},
    {'name': 'Royal Upholstery Fabrics', 'contact_person': 'Imran Qureshi', 'email': 'imran@royalfabrics.example.com', 'phone': '9810011007', 'address': '9, Chandni Chowk Cloth Market', 'city': 'Delhi', 'state': 'Delhi', 'pincode': '110006', 'gst_number': '07AAPFR3178H1Z2'},
    {'name': 'Hettich Fittings Dealer - Okhla', 'contact_person': 'Ankit Bansal', 'email': 'ankit@okhlafittings.example.com', 'phone': '9810011008', 'address': 'B-56, Okhla Phase II', 'city': 'Delhi', 'state': 'Delhi', 'pincode': '110020', 'gst_number': '07AAICO8812L1ZT'},
    {'name': 'Crystal Glass & Mirrors', 'contact_person': 'Harpreet Singh', 'email': 'harpreet@crystalglass.example.com', 'phone': '9810011009', 'address': 'Udyog Vihar Phase 4', 'city': 'Gurugram', 'state': 'Haryana', 'pincode': '122015', 'gst_number': '06AABFC5590N1ZA'},
    {'name': 'Sai Packaging Industries', 'contact_person': 'Pradeep Yadav', 'email': 'pradeep@saipackaging.example.com', 'phone': '9810011010', 'address': 'E-18, Sector 6', 'city': 'Noida', 'state': 'Uttar Pradesh', 'pincode': '201301', 'gst_number': '09AAQFS1463G1Z5'},
    {'name': 'Safety First Equipments', 'contact_person': 'Neha Kapoor', 'email': 'neha@safetyfirst.example.com', 'phone': '9810011011', 'address': '204, Lajpat Rai Market', 'city': 'Delhi', 'state': 'Delhi', 'pincode': '110006', 'gst_number': '07AAMFS7725C1ZH'},
    {'name': 'Jai Mata Di Electricals', 'contact_person': 'Rakesh Kumar', 'email': 'rakesh@jmdelectricals.example.com', 'phone': '9810011012', 'address': '33, Bhagirath Palace', 'city': 'Delhi', 'state': 'Delhi', 'pincode': '110006', 'gst_number': '07ABEPK4390F1ZX'},
]


class Command(BaseCommand):
    help = 'Load sample vendors (suppliers) for demo/showcase. Idempotent.'

    def handle(self, *args, **options):
        created = 0
        for data in SAMPLE_VENDORS:
            if Supplier.objects.filter(name__iexact=data['name']).exists():
                self.stdout.write(f"Already exists: {data['name']}")
                continue
            Supplier.objects.create(**data)
            created += 1
            self.stdout.write(f"Created: {data['name']}")

        cache.delete('suppliers_list')
        self.stdout.write(self.style.SUCCESS(
            f'Done. {created} vendor(s) created, {len(SAMPLE_VENDORS) - created} already existed. '
            f'Total vendors: {Supplier.objects.count()}'
        ))
