# Generated manually for project fields integration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sales', '0003_invoice_department'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='project_name',
            field=models.CharField(max_length=200, blank=True),
        ),
        migrations.AddField(
            model_name='invoice',
            name='project_created_by',
            field=models.CharField(max_length=200, blank=True),
        ),
    ]
