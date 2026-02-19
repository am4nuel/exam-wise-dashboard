import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';
import ROUTES from '../api/routes';

const AuthContext = createContext({
  admin: null,
  login: async () => ({ success: false }),
  logout: () => {},
  loading: true
});

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedAdmin = localStorage.getItem('adminInfo');
    if (savedAdmin) {
      setAdmin(JSON.parse(savedAdmin));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await API.post(ROUTES.ADMIN.LOGIN, { username, password });
      const { token, admin: adminData } = response.data;
      
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminInfo', JSON.stringify(adminData));
      setAdmin(adminData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
