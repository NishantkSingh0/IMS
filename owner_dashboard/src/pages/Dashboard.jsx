import { useState, useEffect } from 'react';
import { salesAPI, inventoryAPI, crmAPI, staffAPI } from '../services/api';
import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiPackage,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const Dashboard = () => {
  const [salesStats, setSalesStats] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const [staffStats, setStaffStats] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        salesRes,
        inventoryRes,
        customerRes,
        staffRes,
        dailyRes,
        paymentRes,
        topProductsRes,
      ] = await Promise.all([
        salesAPI.getStats(),
        inventoryAPI.getStats(),
        crmAPI.getStats(),
        staffAPI.getStats(),
        salesAPI.getDailySummary({ days: 30 }),
        salesAPI.getByPaymentMethod(),
        salesAPI.getTopProducts({ limit: 5 }),
      ]);

      setSalesStats(salesRes.data);
      setInventoryStats(inventoryRes.data);
      setCustomerStats(customerRes.data);
      setStaffStats(staffRes.data);
      setDailySales(dailyRes.data || []);
      setPaymentMethods(paymentRes.data || []);
      setTopProducts(topProductsRes.data || []);
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

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Revenue',
      value: formatCurrency(salesStats?.total_revenue),
      change: '+12.5%',
      changeType: 'increase',
      icon: FiDollarSign,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Total Orders',
      value: salesStats?.total_invoices?.toLocaleString() || '0',
      change: '+8.2%',
      changeType: 'increase',
      icon: FiShoppingBag,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
    },
    {
      name: 'Active Customers',
      value: customerStats?.active_customers?.toLocaleString() || '0',
      change: '+5.1%',
      changeType: 'increase',
      icon: FiUsers,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Products in Stock',
      value: inventoryStats?.active_products?.toLocaleString() || '0',
      subtext: `${inventoryStats?.low_stock_count || 0} low stock`,
      icon: FiPackage,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Overview</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening with your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                {stat.change && (
                  <div className="flex items-center mt-2">
                    {stat.changeType === 'increase' ? (
                      <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <FiTrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span
                      className={`text-sm ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">vs last month</span>
                  </div>
                )}
                {stat.subtext && (
                  <div className="flex items-center mt-2">
                    <FiAlertTriangle className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600">{stat.subtext}</span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 text-${stat.color.replace('bg-', '').replace('-500', '-600')}`} style={{ color: stat.color.includes('green') ? '#16a34a' : stat.color.includes('indigo') ? '#4f46e5' : stat.color.includes('purple') ? '#9333ea' : '#ea580c' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySales}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="total_sales"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="payment_method"
                  label={({ payment_method, percent }) =>
                    `${payment_method}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis
                  type="category"
                  dataKey="product__name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  width={120}
                />
                <Tooltip formatter={(value) => [`${value} units`, 'Sold']} />
                <Bar dataKey="total_quantity" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Average Order Value</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(salesStats?.avg_invoice_value)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Today's Revenue</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(salesStats?.today_revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Pending Payments</span>
              <span className="font-semibold text-orange-600">
                {formatCurrency(salesStats?.pending_amount)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Stock Value</span>
              <span className="font-semibold text-indigo-600">
                {formatCurrency(inventoryStats?.total_stock_value)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Active Staff</span>
              <span className="font-semibold text-gray-900">
                {staffStats?.active_users || 0} members
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
