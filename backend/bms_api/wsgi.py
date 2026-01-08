"""
WSGI config for BMS API project.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bms_api.settings')

application = get_wsgi_application()
