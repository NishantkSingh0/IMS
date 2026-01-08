import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome,
  FiPieChart,
  FiUsers,
  FiPackage,
  FiDollarSign,
  FiUserCheck,
  FiMenu,
  FiX,
  FiLogOut,
  FiUser,
  FiTrendingUp,
} from 'react-icons/fi';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', icon: FiHome, path: '/' },
    { name: 'Analytics', icon: FiPieChart, path: '/analytics' },
    { name: 'Sales Reports', icon: FiTrendingUp, path: '/sales' },
    { name: 'Inventory', icon: FiPackage, path: '/inventory' },
    { name: 'Customers', icon: FiUserCheck, path: '/customers' },
    { name: 'Staff', icon: FiUsers, path: '/staff' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-indigo-900 to-purple-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-indigo-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">BMS</h1>
                <p className="text-indigo-200 text-xs">Owner Dashboard</p>
              </div>
            </div>
            <button
              className="lg:hidden text-white hover:text-indigo-200"
              onClick={() => setSidebarOpen(false)}
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white text-indigo-900 shadow-lg'
                      : 'text-indigo-100 hover:bg-indigo-800'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-indigo-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-indigo-700 rounded-full flex items-center justify-center">
                <FiUser className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-indigo-200 text-sm capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full px-4 py-2 text-indigo-100 hover:bg-indigo-800 rounded-lg transition"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              className="lg:hidden text-gray-600 hover:text-gray-900"
              onClick={() => setSidebarOpen(true)}
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
