import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { salesAPI, inventoryAPI } from '../services/api';
import {
  FiShoppingCart,
  FiDollarSign,
  FiBriefcase,
  FiAlertTriangle,
  FiTrendingUp,
  FiPackage,
  FiArrowRight,
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [salesStats, setSalesStats] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        salesRes,
        inventoryRes,
        departmentsRes,
        dailyRes,
        topProductsRes,
        alertsRes,
        invoicesRes,
      ] = await Promise.all([
        salesAPI.getStats({ days: 30 }),
        inventoryAPI.getStats(),
        inventoryAPI.getDepartments(),
        salesAPI.getDailySummary({ days: 14 }),
        salesAPI.getTopProducts({ days: 30, limit: 5 }),
        inventoryAPI.getLowStockAlerts(),
        salesAPI.getTodayInvoices(),
      ]);

      setSalesStats(salesRes.data);
      setInventoryStats(inventoryRes.data);
      setDepartments(departmentsRes.data.results || departmentsRes.data);
      setDailySummary(dailyRes.data);
      setTopProducts(topProductsRes.data);
      setLowStockAlerts(alertsRes.data);
      setRecentInvoices(invoicesRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
        </div>
        <Link
          to="/billing"
          className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-black transition"
        >
          <FiShoppingCart className="w-5 h-5" />
          <span>New Issue</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Issued Value"
          value={formatCurrency(salesStats?.total_sales)}
          icon={FiDollarSign}
          color="bg-green-500"
          subtext={`${salesStats?.total_invoices || 0} invoices`}
        />
        <StatCard
          title="Total Products"
          value={inventoryStats?.active_products || 0}
          icon={FiPackage}
          color="bg-blue-500"
          subtext={`${inventoryStats?.low_stock_count || 0} low stock`}
        />
        <StatCard
          title="Departments"
          value={departments.length}
          icon={FiBriefcase}
          color="bg-purple-500"
          subtext={`${departments.filter((department) => department.is_active).length} active`}
        />
        <StatCard
          title="Low Stock Alerts"
          value={inventoryStats?.low_stock_count || 0}
          icon={FiAlertTriangle}
          color="bg-orange-500"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Issue Value Trend</h2>
            <span className="text-sm text-gray-500">Last 14 days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'dd MMM')}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(date) => format(new Date(date), 'dd MMM yyyy')}
                />
                <Line
                  type="monotone"
                  dataKey="total_sales"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Top Used Products</h2>
            <Link to="/products" className="text-primary-600 text-sm hover:underline flex items-center">
              View all <FiArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{product.product_name}</p>
                    <p className="text-sm text-gray-500">{product.total_quantity} units issued</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(product.total_revenue)}</p>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-gray-500 text-center py-4">No issue data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Today's Invoices</h2>
            <Link to="/invoices" className="text-primary-600 text-sm hover:underline flex items-center">
              View all <FiArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Department</th>
                  <th className="pb-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="text-sm">
                    <td className="py-3 font-medium text-gray-900">{invoice.invoice_number}</td>
                    <td className="py-3 text-gray-600">{invoice.department_name || '-'}</td>
                    <td className="py-3 font-medium text-gray-900">{formatCurrency(invoice.total_amount)}</td>
                  </tr>
                ))}
                {recentInvoices.length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-gray-500">
                      No invoices today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
            <Link to="/inventory" className="text-primary-600 text-sm hover:underline flex items-center">
              View all <FiArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {lowStockAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
              >
                <div className="flex items-center space-x-3">
                  <FiAlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium text-gray-900">{alert.product_name}</p>
                    <p className="text-sm text-gray-500">SKU: {alert.product_sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">{alert.current_stock} left</p>
                  <p className="text-sm text-gray-500">Min: {alert.min_stock_level}</p>
                </div>
              </div>
            ))}
            {lowStockAlerts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FiTrendingUp className="w-12 h-12 mx-auto mb-2 text-green-400" />
                <p>All stock levels are healthy!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
