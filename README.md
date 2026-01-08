📦 Business Management System (BMS)

A complete web-based platform for managing inventory, billing, sales, CRM, staff, and analytics — with separate dashboards for Store Managers and Business Owners.

⸻

🚀 Overview

The Business Management System (BMS) is a full-stack, production-style platform built using:
	•	React + TailwindCSS (Web Dashboards)
	•	Django REST Framework (Backend)
	•	PostgreSQL (Database)

It provides two separate web dashboards:

⸻

🖥️ 1. Store Manager Dashboard

Designed for store operations, billing, and daily activities.

Store Manager Features

💰 Billing & POS
	•	Create invoices instantly
	•	Add items via search or barcode
	•	Apply discount/GST automatically
	•	Print / download invoice PDF
	•	Track paid/unpaid bills
	•	View daily sales total

📦 Inventory Management
	•	Add/edit products
	•	Manage stock levels
	•	Stock in / stock out
	•	Low-stock alerts
	•	Category & supplier management

👥 Customer CRM
	•	Add customers
	•	View purchase history
	•	Manage outstanding payments

🔍 Quick Utilities
	•	Product search
	•	Daily report view
	•	Quick stock check

⸻

🖥️ 2. Owner Dashboard (Business Admin Panel)

A separate advanced dashboard for business owners.

Owner Panel Features

📊 Full Business Analytics
	•	Monthly/weekly sales charts
	•	Revenue vs profit
	•	Category-wise sales
	•	Top-selling products
	•	Most valuable customers
	•	Inventory valuation
	•	Outstanding amount trends

👤 Staff & Role Management
	•	Add staff (Manager, Cashier, Worker)
	•	Manage roles & permissions
	•	Staff activity log
	•	Sales done by each staff

📥 Data & Reports
	•	Bulk CSV import/export
	•	Generate PDF/Excel reports
	•	Daily sales reports
	•	Monthly GST reports

⚙️ System Configuration
	•	Store settings
	•	Tax/GST settings
	•	Invoice format
	•	Access control

⸻

🧠 Mock Data Included

To showcase everything realistically, the system loads complete mock data:
	•	50+ products
	•	15+ customers
	•	3 months of sales
	•	100+ invoices
	•	Stock movement logs
	•	Low-stock alerts
	•	Supplier list
	•	Separate demo accounts:
	•	Owner: owner@example.com / owner123
	•	Manager: manager@example.com / manager123

All dashboards look fully functional immediately.

⸻

🧱 Tech Stack

Frontend
	•	React.js
	•	TailwindCSS
	•	Recharts / Chart.js
	•	Axios

Backend
	•	Django REST Framework
	•	PostgreSQL
	•	JWT Authentication
	•	Celery (optional)
	•	Swagger API Docs

Deployment
	•	Backend → Render / Railway
	•	Dashboards → Vercel / Netlify
	•	DB → Supabase / Neon

⸻

⚙️ System Architecture

        ┌──────────────────────────┐
        │  Owner Dashboard (React) │
        └───────────▲──────────────┘
                    │
        ┌───────────┼──────────────┐
        │ Store Manager Dashboard  │
        │         (React)          │
        └───────────▲──────────────┘
                    │ API Calls
                    │
          ┌─────────┴──────────┐
          │   Django REST API  │
          └─────────▲──────────┘
                    │ ORM
                    │
          ┌─────────┴──────────┐
          │     PostgreSQL     │
          └────────────────────┘


⸻

🗄️ Database Schema (Simplified)

Inventory
	•	Product
	•	Category
	•	Supplier
	•	StockTransaction

Sales
	•	Invoice
	•	InvoiceItem
	•	PaymentStatus

CRM
	•	Customer
	•	CustomerHistory

Staff & Roles
	•	User
	•	Role
	•	Permissions
	•	ActivityLog

⸻

📂 Recommended File Structure

backend/
  bms_api/
  inventory/
  sales/
  crm/
  staff/
  mock_data.json

manager_dashboard/
  src/
    pages/
    components/
    services/
    layouts/

owner_dashboard/
  src/
    analytics/
    charts/
    components/
    pages/


⸻

▶️ Running the Project

Backend

cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata mock_data.json
python manage.py runserver

Store Manager Dashboard

cd manager_dashboard
npm install
npm run dev

Owner Dashboard

cd owner_dashboard
npm install
npm run dev


⸻

🌐 Deployment
	•	Deploy backend to Render/Railway
	•	Deploy dashboards separately to Vercel/Netlify
	•	Set API base URL in .env

⸻

🚀 Future Enhancements
	•	Multi-store support (franchise mode)
	•	AI-based demand forecasting
	•	Supplier analytics
	•	WhatsApp invoice sharing
	•	Expense tracking
	•	Automated daily email reports

⸻

⭐ If You Like This Project

Star the repo and connect for feedback!

⸻
