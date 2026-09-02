import { useState, useEffect } from 'react';
import { salesAPI } from '../services/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import {
  FiCalendar,
  FiDollarSign,
  FiShoppingCart,
  FiFilter,
  FiDownload,
  FiCreditCard,
} from 'react-icons/fi';

const Sales = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [dailySales, setDailySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchSalesData();
  }, [dateRange]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const [dailyRes, topProductsRes, paymentRes, invoicesRes, statsRes] = await Promise.all([
        salesAPI.getDailySummary({ days: parseInt(dateRange) }),
        salesAPI.getTopProducts({ limit: 10, days: parseInt(dateRange) }),
        salesAPI.getByPaymentMethod({ days: parseInt(dateRange) }),
        salesAPI.getInvoices({ page_size: 10, ordering: '-created_at' }),
        salesAPI.getStats(),
      ]);

      setDailySales(dailyRes.data || []);
      setTopProducts(topProductsRes.data || []);
      setPaymentMethods(paymentRes.data || []);
      setRecentInvoices(invoicesRes.data?.results || invoicesRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching sales data:', error);
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

  const COLORS = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-700',
      partial: 'bg-yellow-100 text-yellow-700',
      pending: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-gray-500">Detailed sales analytics and reports</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last Year</option>
          </select>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Period Revenue</p>
              <p className="text-2xl font-bold text-indigo-600">
                {formatCurrency(dailySales.reduce((sum, d) => sum + (d.revenue || 0), 0))}
              </p>
            </div>
            <FiDollarSign className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Period Orders</p>
              <p className="text-2xl font-bold text-purple-600">
                {dailySales.reduce((sum, d) => sum + (d.orders || 0), 0)}
              </p>
            </div>
            <FiShoppingCart className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Daily Sales</p>
              <p className="text-2xl font-bold text-cyan-600">
                {formatCurrency(
                  dailySales.reduce((sum, d) => sum + (d.revenue || 0), 0) /
                    (dailySales.length || 1)
                )}
              </p>
            </div>
            <FiCalendar className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats?.outstanding_amount)}
              </p>
            </div>
            <FiCreditCard className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                tickFormatter={(v) => format(new Date(v), 'MMM d')}
              />
              <YAxis stroke="#6b7280" tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip
                labelFormatter={(v) => format(new Date(v), 'MMMM d, yyyy')}
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethods}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="total"
                nameKey="method"
                label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`}
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

      {/* Top Products & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Used Products</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {topProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.quantity} units sold</p>
                  </div>
                </div>
                <p className="font-semibold text-indigo-600">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                  <p className="text-sm text-gray-500">
                    {invoice.customer_name || 'Walk-in'} •{' '}
                    {format(new Date(invoice.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(invoice.total_amount)}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusBadge(
                      invoice.payment_status
                    )}`}
                  >
                    {invoice.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
