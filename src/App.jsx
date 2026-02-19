import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

const PrivateRoute = ({ children }) => {
  const auth = useAuth();
  
  if (!auth || auth.loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  return auth.admin ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/dashboard/*" 
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Router>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
