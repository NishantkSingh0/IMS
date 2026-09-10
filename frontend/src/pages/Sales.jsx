import { useState, useEffect } from 'react';
import { salesAPI } from '../services/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  FiBriefcase,
} from 'react-icons/fi';

const Sales = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const [dailySales, setDailySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [departmentUsage, setDepartmentUsage] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    fetchSalesData();
  }, [dateRange]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const [dailyRes, topProductsRes, departmentRes, invoicesRes] = await Promise.all([
        salesAPI.getDailySummary({ days: parseInt(dateRange) }),
        salesAPI.getTopProducts({ limit: 10, days: parseInt(dateRange) }),
        salesAPI.getByDepartment({ days: parseInt(dateRange) }),
        salesAPI.getInvoices({ page_size: 10, ordering: '-created_at' }),
      ]);

      setDailySales(dailyRes.data || []);
      setTopProducts(topProductsRes.data || []);
      setDepartmentUsage(departmentRes.data || []);
      setRecentInvoices(invoicesRes.data?.results || invoicesRes.data || []);
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
          <h1 className="text-2xl font-bold text-gray-900">Issue Reports</h1>
          <p className="text-gray-500">Detailed factory inventory issue analytics and reports</p>
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
              <p className="text-sm text-gray-500">Period Issue Value</p>
              <p className="text-2xl font-bold text-indigo-600">
                {formatCurrency(dailySales.reduce((sum, d) => sum + (d.total_sales || 0), 0))}
              </p>
            </div>
            <FiDollarSign className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Period Invoices</p>
              <p className="text-2xl font-bold text-purple-600">
                {dailySales.reduce((sum, d) => sum + (d.invoice_count || 0), 0)}
              </p>
            </div>
            <FiShoppingCart className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Daily Issue</p>
              <p className="text-2xl font-bold text-cyan-600">
                {formatCurrency(
                  dailySales.reduce((sum, d) => sum + (d.total_sales || 0), 0) /
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
              <p className="text-sm text-gray-500">Departments Used</p>
              <p className="text-2xl font-bold text-red-600">
                {departmentUsage.length}
              </p>
            </div>
            <FiBriefcase className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Issue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Issues</h2>
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
              <Bar dataKey="total_sales" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Usage */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Usage</h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {departmentUsage.map((department) => (
              <div key={department.department_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{department.department_name}</p>
                  <p className="text-sm text-gray-500">{department.count} invoices</p>
                </div>
                <p className="font-semibold text-indigo-600">{formatCurrency(department.total)}</p>
              </div>
            ))}
            {departmentUsage.length === 0 && (
              <p className="text-gray-500 text-center py-8">No department usage yet</p>
            )}
          </div>
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
                    <p className="font-medium text-gray-900">{product.product_name}</p>
                    <p className="text-sm text-gray-500">{product.total_quantity} units issued</p>
                  </div>
                </div>
                <p className="font-semibold text-indigo-600">{formatCurrency(product.total_revenue)}</p>
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
                    {invoice.department_name || '-'} •{' '}
                    {format(new Date(invoice.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(invoice.total_amount)}
                  </p>
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
