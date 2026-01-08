import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await authAPI.getProfile();
        // Only allow owner role for this dashboard
        if (response.data.role === 'owner') {
          setUser(response.data);
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      const profileResponse = await authAPI.getProfile();
      
      // Only allow owner role for this dashboard
      if (profileResponse.data.role !== 'owner') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Access denied. This dashboard is for business owners only.');
      }
      
      setUser(profileResponse.data);
      return { success: true };
    } catch (error) {
      const message = error.message || error.response?.data?.detail || 'Login failed';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
