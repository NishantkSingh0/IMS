# IMS dev commands
# Usage: make api | make redis | make migrations | make seed | make web

PY       = backend/venv/bin/python
MANAGE   = $(PY) backend/manage.py

.PHONY: api redis migrations seed web test lint build

# Django API on :8000
api:
	$(MANAGE) runserver 0.0.0.0:8000

# Redis in the background (stop with: redis-cli shutdown)
redis:
	redis-server --daemonize yes

# Create + apply DB migrations
migrations:
	$(MANAGE) makemigrations
	$(MANAGE) migrate

# Load demo/mock data (users, products, vendors)
seed:
	$(MANAGE) load_mock_data
	$(MANAGE) load_sample_vendors

# Vite frontend on :5173
web:
	cd frontend && npm run dev

# Extras
test:
	$(MANAGE) test purchases inventory sales

lint:
	cd frontend && npx oxlint src

build:
	cd frontend && npx vite build
