import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });
          
          localStorage.setItem('access_token', response.data.access);
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/token/', credentials),
  refreshToken: (refresh) => api.post('/token/refresh/', { refresh }),
  getProfile: () => api.get('/staff/users/me/'),
};

// Staff API
export const staffAPI = {
  getUsers: (params) => api.get('/staff/users/', { params }),
  getUser: (id) => api.get(`/staff/users/${id}/`),
  createUser: (data) => api.post('/staff/users/', data),
  updateUser: (id, data) => api.patch(`/staff/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/staff/users/${id}/`),
  getStats: () => api.get('/staff/users/stats/'),
  getActivityLog: (params) => api.get('/staff/activity-logs/', { params }),
};

// Inventory API
export const inventoryAPI = {
  getProducts: (params) => api.get('/inventory/products/', { params }),
  getProduct: (id) => api.get(`/inventory/products/${id}/`),
  createProduct: (data) => api.post('/inventory/products/', data),
  updateProduct: (id, data) => api.patch(`/inventory/products/${id}/`, data),
  deleteProduct: (id) => api.delete(`/inventory/products/${id}/`),
  getLowStock: () => api.get('/inventory/products/low_stock/'),
  getOutOfStock: () => api.get('/inventory/products/out_of_stock/'),
  getStats: () => api.get('/inventory/products/stats/'),
  getCategories: () => api.get('/inventory/categories/'),
  getSuppliers: () => api.get('/inventory/suppliers/'),
  getTransactions: (params) => api.get('/inventory/transactions/', { params }),
};

// Sales API
export const salesAPI = {
  getInvoices: (params) => api.get('/sales/invoices/', { params }),
  getInvoice: (id) => api.get(`/sales/invoices/${id}/`),
  getStats: () => api.get('/sales/invoices/stats/'),
  getToday: () => api.get('/sales/invoices/today/'),
  getDailySummary: (params) => api.get('/sales/invoices/daily_summary/', { params }),
  getMonthlySummary: (params) => api.get('/sales/invoices/monthly_summary/', { params }),
  getTopProducts: (params) => api.get('/sales/invoices/top_products/', { params }),
  getByPaymentMethod: (params) => api.get('/sales/invoices/by_payment_method/', { params }),
  getDailySales: (params) => api.get('/sales/daily-sales/', { params }),
};

// CRM API
export const crmAPI = {
  getCustomers: (params) => api.get('/crm/customers/', { params }),
  getCustomer: (id) => api.get(`/crm/customers/${id}/`),
  getStats: () => api.get('/crm/customers/stats/'),
  getTopCustomers: (params) => api.get('/crm/customers/top_customers/', { params }),
  getWithOutstanding: () => api.get('/crm/customers/with_outstanding/'),
};

export default api;
