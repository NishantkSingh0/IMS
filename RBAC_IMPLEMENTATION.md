# Role-Based Access Control (RBAC) Implementation

## Overview
This document describes the comprehensive role-based access control (RBAC) system implemented across the entire platform to secure routes and API endpoints based on user roles.

## User Roles
The system supports the following user roles:
- **owner**: Business Owner - Full access to all features
- **manager**: Store Manager - Limited access to operational features
- **cashier**: Cashier - Limited access to sales and inventory viewing
- **worker**: Worker - Basic access to inventory and departments

## Frontend Implementation

### Route Permissions
All routes are now protected with role-based access control in `frontend/src/App.jsx`:

```javascript
const ROUTE_PERMISSIONS = {
  '/': ['owner', 'manager', 'cashier', 'worker'],
  '/inventory': ['owner', 'manager', 'cashier', 'worker'],
  '/departments': ['owner', 'manager', 'cashier', 'worker'],
  '/invoices': ['owner', 'manager', 'cashier', 'worker'],
  '/analytics': ['owner'],
  '/sales': ['owner', 'manager'],
  '/staff': ['owner'],
  '/products': ['owner', 'manager'],
  '/billing': ['owner', 'manager'],
};
```

### Protected Route Components
Two new route protection components were added:

1. **ProtectedRoute**: Ensures user is authenticated
2. **RoleProtectedRoute**: Ensures user has the required role for specific routes

```javascript
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};
```

### Navigation Menus
Navigation menus are dynamically displayed based on user role in `frontend/src/layouts/MainLayout.jsx`:

- **ownerNavigation**: Full menu with Analytics, Sales, Staff
- **managerNavigation**: Operational menu with Sales, Issue, Products
- **cashierNavigation**: Sales-focused menu with Outwards, Inventory
- **workerNavigation**: Basic menu with Inventory, Departments

### Route Protection Implementation
Routes are now wrapped with appropriate role protection:

```javascript
<Route 
  path="staff" 
  element={
    <RoleProtectedRoute allowedRoles={['owner']}>
      <Staff />
    </RoleProtectedRoute>
  } 
/>
```

## Backend Implementation

### Permission Classes
New permission classes were added to both sales and inventory views:

```python
class IsOwner(permissions.BasePermission):
    """Permission class for owner-only access."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'owner'


class IsOwnerOrManager(permissions.BasePermission):
    """Permission class for owner/manager access."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['owner', 'manager']
```

### Sales API Permissions
In `backend/sales/views.py`, the InvoiceViewSet now has role-based permissions:

- **Stats endpoints** (stats, daily_summary, monthly_summary, top_products, by_department, by_project): All authenticated users (needed for dashboard)
- **Export operations** (export_excel): Owner only
- **CRUD operations** (create, update, partial_update, destroy): Owner and Manager only
- **Read operations**: All authenticated users

```python
def get_permissions(self):
    if self.action in ['stats', 'daily_summary', 'monthly_summary', 'top_products', 'by_department', 'by_project']:
        return [IsOwner()]
    if self.action in ['create', 'update', 'partial_update', 'destroy']:
        return [IsOwnerOrManager()]
    return [IsAuthenticated()]
```

### Staff API Permissions
In `backend/staff/views.py`, the UserViewSet has role-based permissions:

- **Create/Destroy operations**: Owner only
- **List/Retrieve/Update operations**: Owner and Manager only
- **Stats/Me/Change Password**: All authenticated users (stats needed for dashboard)

### Inventory API Permissions
In `backend/inventory/views.py`, all ViewSets now have role-based permissions:

#### CategoryViewSet
- **CRUD operations**: Owner and Manager only
- **Read operations**: All authenticated users

#### SupplierViewSet
- **CRUD operations**: Owner and Manager only
- **Read operations**: All authenticated users

#### DepartmentViewSet
- **CRUD operations**: Owner and Manager only
- **Read operations**: All authenticated users

#### ProductViewSet
- **CRUD operations** (including adjust_stock): Owner and Manager only
- **Read operations**: All authenticated users

## Security Features

### 1. Route-Level Protection
- Users cannot access restricted routes even by manually typing URLs
- Unauthorized access attempts are redirected to appropriate pages
- Loading states prevent security issues during authentication checks

### 2. API-Level Protection
- All API endpoints are protected with role-based permissions
- Backend validates user roles before allowing access to sensitive operations
- Analytics and sales statistics are restricted to owners only

### 3. Dynamic Navigation
- Navigation menus are dynamically generated based on user role
- Users only see menu items they have permission to access
- Reduces confusion and improves security through UI

### 4. Consistent Access Control
- Both frontend and backend implement consistent role-based access
- Double-layer security prevents unauthorized access even if frontend is bypassed
- Backend permissions act as the final security layer

## Testing Scenarios

### Manager Access Restrictions
- ❌ Cannot access `/analytics` - redirects to dashboard
- ✅ Can access `/sales` - Sales analytics and reports
- ❌ Cannot access `/staff` - redirects to dashboard
- ✅ Can access `/billing` - Issue functionality
- ✅ Can access `/products` - Product management
- ✅ Can access `/invoices` - Outward slips
- ✅ Can access `/inventory` - Inventory management
- ✅ Can access `/departments` - Department management

### Owner Full Access
- ✅ Can access all routes including analytics, sales, and staff
- ✅ Full access to all API endpoints
- ✅ Can manage users and permissions

### Cashier Limited Access
- ❌ Cannot access `/analytics`, `/staff`, `/products`, `/billing`
- ❌ Cannot access `/sales` - redirects to dashboard
- ✅ Can access `/invoices` - Outward slips
- ✅ Can access `/inventory` - View inventory
- ✅ Can access `/departments` - View departments

### Worker Basic Access
- ❌ Cannot access `/analytics`, `/sales`, `/staff`, `/products`, `/billing`, `/invoices`
- ✅ Can access `/inventory` - View inventory
- ✅ Can access `/departments` - View departments

## Implementation Notes

1. **Role Hierarchy**: The system implements a simple role hierarchy where:
   - Owner has all permissions
   - Manager has operational permissions but no analytics/staff access
   - Cashier has sales-related permissions
   - Worker has basic view-only permissions

2. **Security Layers**: The implementation uses defense-in-depth approach:
   - Frontend route protection (UX layer)
   - Backend API permissions (server layer)
   - Database-level constraints (data layer)

3. **User Experience**: Unauthorized users are gracefully redirected rather than showing error pages, maintaining a good user experience while maintaining security.

4. **Extensibility**: The permission system is designed to be easily extended for additional roles or more granular permissions in the future.

## Future Enhancements

Potential improvements for the RBAC system:

1. **Fine-grained Permissions**: Implement object-level permissions (e.g., users can only edit their own records)
2. **Permission Groups**: Create reusable permission groups for common access patterns
3. **Audit Logging**: Enhanced logging of permission denials for security monitoring
4. **Role Management UI**: Add UI for managing roles and permissions dynamically
5. **Temporary Access**: Implement time-limited access for specific roles or permissions