import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Analytics from './pages/Analytics';
import Inventory from './pages/Inventory';
import DamageReports from './pages/DamageReports';
import { motion, AnimatePresence } from 'motion/react';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-brand-lime border-t-transparent rounded-full mb-4"
        />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Syncing Encryption Layer...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && roles.includes('admin') && !isAdmin) {
    return <Navigate to="/app" />;
  }

  return <>{children}</>;
};

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
        
        <Route path="/app" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="user-management" element={
            <ProtectedRoute roles={['admin']}>
              <PageWrapper><UserManagement /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="analytics" element={
            <ProtectedRoute roles={['admin']}>
              <PageWrapper><Analytics /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="inventory" element={<PageWrapper><Inventory /></PageWrapper>} />
          <Route path="reports" element={<PageWrapper><DamageReports /></PageWrapper>} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  );
}
