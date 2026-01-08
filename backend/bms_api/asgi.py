"""
ASGI config for BMS API project.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bms_api.settings')

application = get_asgi_application()
