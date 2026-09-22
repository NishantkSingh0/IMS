# Generated migration to normalize unit values to lowercase

from django.db import migrations


def normalize_unit_values(apps, schema_editor):
    """Normalize all unit values to lowercase to match UNIT_CHOICES."""
    Product = apps.get_model('inventory', 'Product')
    
    for product in Product.objects.all():
        if product.unit and product.unit != product.unit.lower():
            product.unit = product.unit.lower()
            product.save(update_fields=['unit'])


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0007_remove_unnecessary_product_fields'),
    ]

    operations = [
        migrations.RunPython(normalize_unit_values, migrations.RunPython.noop),
    ]
