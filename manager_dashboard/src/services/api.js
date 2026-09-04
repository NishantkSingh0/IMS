import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
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
  (error) => {
    return Promise.reject(error);
  }
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
          const response = await axios.post(`${API_URL}/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
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

export default api;

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/token/', { email, password }),
  refreshToken: (refresh) => api.post('/token/refresh/', { refresh }),
  getProfile: () => api.get('/staff/users/me/'),
  changePassword: (data) => api.post('/staff/users/change_password/', data),
};

// Inventory API
export const inventoryAPI = {
  getProducts: (params) => api.get('/inventory/products/', { params }),
  getProduct: (id) => api.get(`/inventory/products/${id}/`),
  createProduct: (data) => api.post('/inventory/products/', data),
  updateProduct: (id, data) => api.patch(`/inventory/products/${id}/`, data),
  deleteProduct: (id) => api.delete(`/inventory/products/${id}/`),
  searchByBarcode: (barcode) => api.get('/inventory/products/search_barcode/', { params: { barcode } }),
  getLowStock: () => api.get('/inventory/products/low_stock/'),
  getStats: () => api.get('/inventory/products/stats/'),
  adjustStock: (id, data) => api.post(`/inventory/products/${id}/adjust_stock/`, data),
  
  getCategories: () => api.get('/inventory/categories/'),
  getSuppliers: () => api.get('/inventory/suppliers/'),
  getDepartments: (params) => api.get('/inventory/departments/', { params }),
  getDepartment: (id) => api.get(`/inventory/departments/${id}/`),
  createDepartment: (data) => api.post('/inventory/departments/', data),
  updateDepartment: (id, data) => api.patch(`/inventory/departments/${id}/`, data),
  deleteDepartment: (id) => api.delete(`/inventory/departments/${id}/`),
  
  getLowStockAlerts: () => api.get('/inventory/low-stock-alerts/unacknowledged/'),
  acknowledgeAlert: (id) => api.post(`/inventory/low-stock-alerts/${id}/acknowledge/`),
};

// Sales API
export const salesAPI = {
  getInvoices: (params) => api.get('/sales/invoices/', { params }),
  getInvoice: (id) => api.get(`/sales/invoices/${id}/`),
  createInvoice: (data) => api.post('/sales/invoices/', data),
  getTodayInvoices: () => api.get('/sales/invoices/today/'),
  cancelInvoice: (id) => api.post(`/sales/invoices/${id}/cancel/`),
  getStats: (params) => api.get('/sales/invoices/stats/', { params }),
  getDailySummary: (params) => api.get('/sales/invoices/daily_summary/', { params }),
  getTopProducts: (params) => api.get('/sales/invoices/top_products/', { params }),
  getByDepartment: (params) => api.get('/sales/invoices/by_department/', { params }),
};
