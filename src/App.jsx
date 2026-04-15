import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Rankings from './pages/Rankings';
import Enrollments from './pages/Enrollments'; 
import ActiveCourses from './pages/ActiveCourses';
import AtRisk from './pages/AtRisk';
import Analytics from './pages/Analytics';
import AddData from './pages/AddData';
import YourData from './pages/YourData'; 
import Login from './pages/Login';
import useStore from './store/useStore';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';

// ==========================================
// 1. AUTH GUARDS (The Security Checkpoints)
// ==========================================

// Protects private pages: Kicks users to /login if they don't have a valid token
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('uni_token');
  
  // If no token exists, boot them to the registration screen
  if (!token) {
    return <Navigate to="/login?register=true" replace />;
  }
  
  // If token exists, let them in and wrap the page in your Layout (sidebar/navbar)
  return <Layout>{children}</Layout>;
};

// Protects public pages: Stops logged-in users from seeing the login/forgot-password screen
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('uni_token');
  
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// ==========================================
// 2. MAIN APP ROUTER
// ==========================================

function App() {
  const { isDarkMode } = useStore();

  // Keep your Dark Mode logic intact
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Base URL Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* PUBLIC ROUTES (Only accessible if logged OUT) */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />

        {/* PROTECTED ROUTES (Only accessible if logged IN) */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/enrollments" element={<ProtectedRoute><Enrollments /></ProtectedRoute>} /> 
        <Route path="/rankings" element={<ProtectedRoute><Rankings /></ProtectedRoute>} />
        <Route path="/add-data" element={<ProtectedRoute><AddData /></ProtectedRoute>} />
        <Route path="/your-data" element={<ProtectedRoute><YourData /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><ActiveCourses /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/at-risk" element={<ProtectedRoute><AtRisk /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Catch-all: If user types a random URL, send them back to the start */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;