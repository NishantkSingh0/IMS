import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';

// Lazy load components for code splitting
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Sales = lazy(() => import('./pages/Sales'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Departments = lazy(() => import('./pages/Departments'));
const Staff = lazy(() => import('./pages/Staff'));
const Products = lazy(() => import('./pages/Products'));
const Billing = lazy(() => import('./pages/Billing'));
const Invoices = lazy(() => import('./pages/Invoices'));

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
  </div>
);

// Route permissions based on user roles
const ROUTE_PERMISSIONS = {
  '/': ['owner', 'manager', 'cashier', 'worker'],
  '/inventory': ['owner', 'manager', 'cashier', 'worker'],
  '/departments': ['owner', 'manager', 'cashier', 'worker'],
  '/invoices': ['owner', 'manager', 'cashier', 'worker'],
  '/analytics': ['owner'],
  '/sales': ['owner'],
  '/staff': ['owner'],
  '/products': ['owner', 'manager'],
  '/billing': ['owner', 'manager'],
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role-based Protected Route Component
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="departments" element={<Departments />} />
              <Route path="invoices" element={<Invoices />} />
              <Route 
                path="analytics" 
                element={
                  <RoleProtectedRoute allowedRoles={['owner']}>
                    <Analytics />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="sales" 
                element={
                  <RoleProtectedRoute allowedRoles={['owner']}>
                    <Sales />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="staff" 
                element={
                  <RoleProtectedRoute allowedRoles={['owner']}>
                    <Staff />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="products" 
                element={
                  <RoleProtectedRoute allowedRoles={['owner', 'manager']}>
                    <Products />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="billing" 
                element={
                  <RoleProtectedRoute allowedRoles={['owner', 'manager']}>
                    <Billing />
                  </RoleProtectedRoute>
                } 
              />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
