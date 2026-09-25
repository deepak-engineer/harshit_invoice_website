import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, FileText, Settings, LogOut, Users, MapPin, Camera, Calendar, Receipt, CheckSquare, ClipboardCheck } from 'lucide-react';
import api from '../utils/api';
import logoDark from '../assets/crons-logo-dark.svg';
import logoLight from '../assets/crons-logo-light.svg';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
      navigate('/login'); // Force navigate anyway
    }
  };

  const adminNavItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Attendance', path: '/admin/attendance-list', icon: ClipboardCheck },
    { name: 'Attendance Report', path: '/admin/attendance-report', icon: Calendar },
    { name: 'Employees', path: '/admin/employees', icon: Users },
    { name: 'Teams', path: '/admin/teams', icon: Users },
    { name: 'Sites', path: '/admin/sites', icon: MapPin },
    { name: 'Expenses', path: '/admin/expenses', icon: Receipt },
    { name: 'Invoices', path: '/admin/invoices', icon: FileText },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const employeeNavItems = [
    { name: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
    { name: 'Mark Attendance', path: '/employee/attendance', icon: Camera },
    { name: 'Site Work', path: '/employee/work', icon: CheckSquare },
    { name: 'My Expenses', path: '/employee/expenses', icon: Receipt },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  const isActive = (path) => {
    if (path === '/admin/dashboard' && location.pathname === '/admin/dashboard') return true;
    if (path === '/employee/dashboard' && location.pathname === '/employee/dashboard') return true;
    if (path === '/admin/invoices' && (location.pathname === '/admin/invoices' || location.pathname.includes('/invoice/'))) return true;
    if (path === '/admin/settings' && location.pathname === '/admin/settings') return true;
    if (path === '/admin/expenses' && location.pathname === '/admin/expenses') return true;
    if (path === '/employee/expenses' && location.pathname === '/employee/expenses') return true;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-white/90">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="p-4 flex items-center h-20 border-b border-gray-100 dark:border-gray-800">
          <img src={logoDark} alt="Logo" className="max-h-full w-full object-contain dark:hidden" />
          <img src={logoLight} alt="Logo" className="max-h-full w-full object-contain hidden dark:block" />
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-6 overflow-y-auto custom-scrollbar">
          <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
             {isAdmin ? 'Menu' : 'Employee Menu'}
          </div>
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-theme-sm font-medium ${
                isActive(item.path)
                  ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex flex-col space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-lg text-theme-sm font-medium text-error-600 hover:bg-error-50 dark:text-error-500 dark:hover:bg-error-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header & Menu */}
      <div className="md:hidden fixed top-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="flex items-center justify-between p-4 h-16">
          <img src={logoDark} alt="Logo" className="h-8 max-w-[200px] object-contain dark:hidden" />
          <img src={logoLight} alt="Logo" className="h-8 max-w-[200px] object-contain hidden dark:block" />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {isMobileMenuOpen && (
          <div className="absolute w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="flex flex-col p-4 space-y-1.5">
              <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {isAdmin ? 'Menu' : 'Employee Menu'}
              </div>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-theme-sm font-medium ${
                    isActive(item.path)
                      ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="my-2 border-t border-gray-100 dark:border-gray-800"></div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-theme-sm font-medium text-error-600 hover:bg-error-50 dark:text-error-500 dark:hover:bg-error-500/10 transition-colors w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:overflow-hidden pt-16 md:pt-0 bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
