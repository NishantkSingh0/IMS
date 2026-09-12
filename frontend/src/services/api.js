import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
// const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.162:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// Helper function for delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - Token refresh
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
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Retry logic for retryable errors
    if (RETRYABLE_STATUS_CODES.includes(error.response?.status) && !originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    if (originalRequest._retryCount < MAX_RETRIES && RETRYABLE_STATUS_CODES.includes(error.response?.status)) {
      originalRequest._retryCount += 1;
      await delay(RETRY_DELAY * originalRequest._retryCount);
      return api(originalRequest);
    }

    // Error handling with user-friendly messages
    let errorMessage = 'An error occurred';

    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 400:
          errorMessage = error.response.data?.detail || 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 409:
          errorMessage = error.response.data?.detail || 'Conflict. This resource already exists.';
          break;
        case 422:
          errorMessage = error.response.data?.detail || 'Validation error. Please check your input.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'Service unavailable. Please try again later.';
          break;
        default:
          errorMessage = error.response.data?.detail || `Error: ${error.response.status}`;
      }
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'Network error. Please check your connection.';
    } else {
      // Error in request setup
      errorMessage = error.message || 'An unexpected error occurred.';
    }

    // Show toast notification for errors (except for silent requests)
    if (!originalRequest?.silent) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/staff/token/', { email, password }),
  refreshToken: (refresh) => api.post('/token/refresh/', { refresh }),
  getProfile: () => api.get('/staff/users/me/'),
  changePassword: (data) => api.post('/staff/users/change_password/', data),
};

// Staff API (from owner dashboard)
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
  searchByBarcode: (barcode) => api.get('/inventory/products/search_barcode/', { params: { barcode } }),
  getLowStock: () => api.get('/inventory/products/low_stock/'),
  getOutOfStock: () => api.get('/inventory/products/out_of_stock/'),
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
  getTransactions: (params) => api.get('/inventory/stock-transactions/', { params }),
};

// Sales API
export const salesAPI = {
  getInvoices: (params) => api.get('/sales/invoices/', { params }),
  getInvoice: (id) => api.get(`/sales/invoices/${id}/`),
  createInvoice: (data) => api.post('/sales/invoices/', data),
  getTodayInvoices: () => api.get('/sales/invoices/today/'),
  getToday: () => api.get('/sales/invoices/today/'),
  cancelInvoice: (id) => api.post(`/sales/invoices/${id}/cancel/`),
  getStats: (params) => api.get('/sales/invoices/stats/', { params }),
  getDailySummary: (params) => api.get('/sales/invoices/daily_summary/', { params }),
  getMonthlySummary: (params) => api.get('/sales/invoices/monthly_summary/', { params }),
  getTopProducts: (params) => api.get('/sales/invoices/top_products/', { params }),
  getByDepartment: (params) => api.get('/sales/invoices/by_department/', { params }),
  getByProject: (params) => api.get('/sales/invoices/by_project/', { params }),
  getDailySales: (params) => api.get('/sales/daily-sales/', { params }),
  exportInvoicesExcel: (params) => {
    const token = localStorage.getItem('access_token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const queryString = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/sales/invoices/export_excel/?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).then(response => {
      if (!response.ok) {
        throw new Error('Failed to export invoices');
      }
      return response.blob();
    });
  },
};

// External Projects API
const PROJECTS_API_URL = 'https://coaknore-production.up.railway.app/api';

export const projectsAPI = {
  getProjects: (params = {}) => {
    const defaultParams = { page: 1, page_size: 20 };
    return axios.get(`${PROJECTS_API_URL}/projects`, { 
      params: { ...defaultParams, ...params } 
    });
  },
};
