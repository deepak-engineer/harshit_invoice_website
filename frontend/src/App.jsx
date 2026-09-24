import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InvoiceForm from './pages/InvoiceForm';
import VendorSettings from './pages/VendorSettings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import SiteManagement from './pages/admin/SiteManagement';
import TeamManagement from './pages/admin/TeamManagement';
import AttendanceReport from './pages/admin/AttendanceReport';
import AdminExpenses from './pages/admin/AdminExpenses';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import AttendanceFlow from './pages/employee/AttendanceFlow';
import EmployeeExpenses from './pages/employee/EmployeeExpenses';

import api from './utils/api';

const RoleProtectedRoute = ({ allowedRole }) => {
  const [authStatus, setAuthStatus] = useState({ loading: true, authenticated: false, role: null });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/check-auth');
        setAuthStatus({
          loading: false,
          authenticated: res.data.authenticated,
          role: res.data.role
        });
      } catch (error) {
        setAuthStatus({ loading: false, authenticated: false, role: null });
      }
    };
    checkAuth();
  }, []);

  if (authStatus.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authStatus.authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && authStatus.role !== allowedRole) {
     // Redirect to their respective dashboard if wrong role
     return <Navigate to={`/${authStatus.role}/dashboard`} replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route element={<RoleProtectedRoute allowedRole="admin" />}>
          <Route path="/admin" element={<Layout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="attendance-report" element={<AttendanceReport />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="teams" element={<TeamManagement />} />
            <Route path="sites" element={<SiteManagement />} />
            <Route path="expenses" element={<AdminExpenses />} />
            
            {/* Existing Admin Features */}
            <Route path="invoices" element={<Dashboard />} />
            <Route path="invoice/new" element={<InvoiceForm />} />
            <Route path="invoice/:id/edit" element={<InvoiceForm />} />
            <Route path="settings" element={<VendorSettings />} />
          </Route>
        </Route>

        {/* Employee Routes */}
        <Route element={<RoleProtectedRoute allowedRole="employee" />}>
          <Route path="/employee" element={<Layout />}>
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="attendance" element={<AttendanceFlow />} />
            <Route path="expenses" element={<EmployeeExpenses />} />
          </Route>
        </Route>
        
        {/* Legacy redirect for old URLs or root */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
