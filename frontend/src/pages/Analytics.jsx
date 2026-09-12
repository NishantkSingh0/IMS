import { useState, useEffect } from 'react';
import { salesAPI } from '../services/api';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiDollarSign, FiShoppingCart, FiTrendingUp } from 'react-icons/fi';
import { TbMathAvg } from "react-icons/tb";
import { format, parseISO } from 'date-fns';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const [dailySales, setDailySales] = useState([]);
  const [salesInvoices, setSalesInvoices] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [dailyRes, salesInvoicesRes, monthlyRes, statsRes] = await Promise.all([
        salesAPI.getDailySummary({ days: parseInt(dateRange) }),
        salesAPI.getInvoices(),
        salesAPI.getMonthlySummary({ months: 12 }),
        salesAPI.getStats(),
      ]);
      setSalesInvoices(salesInvoicesRes.data);
      setDailySales(dailyRes.data || []);
      setMonthlySales(monthlyRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  const calculateGrowth = () => {
    if (monthlySales.length < 2) return 0;

    const current = monthlySales[monthlySales.length - 1]?.total_sales || 0;
    const previous = monthlySales[monthlySales.length - 2]?.total_sales || 0;

    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    const growth = ((current - previous) / previous) * 100;

    return Math.max(-100, Math.min(100, growth)).toFixed(1);
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Deep dive into factory inventory issue metrics</p>
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
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Issued Value"
          value={formatCurrency(stats?.total_sales)}
          icon={FiDollarSign}
          color="indigo"
        />
        <KPICard
          title="Total Invoices"
          value={salesInvoices?.count?.toLocaleString() || 0}
          icon={FiShoppingCart}
          color="purple"
        />
        <KPICard
          title="Avg Invoice Value"
          value={formatCurrency(stats?.average_invoice_value)}
          icon={TbMathAvg}
          color="cyan"
        />
        <KPICard
          title="Outward Growth Rate"
          value={`${calculateGrowth()}%`}
          icon={FiTrendingUp}
          color={parseFloat(calculateGrowth()) >= 0 ? 'emerald' : 'red'}
        />
      </div>

      {/* Daily Issue Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Issue Trend</h2>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={dailySales}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tickFormatter={(v) => format(new Date(v), 'dd-MM-yyyy')}
            />
            <YAxis stroke="#6b7280" yAxisId="left" tickFormatter={(v) => `₹${v / 1000}k`} />
            <YAxis stroke="#6b7280" yAxisId="right" orientation="right" />
            <Tooltip
              labelFormatter={(v) => format(new Date(v), 'dd-MM-yyyy')}
              formatter={(value, name) =>
                name === 'Issued Value' ? formatCurrency(value) : value
              }
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="total_sales"
              stroke="#4f46e5"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              name="Issued Value"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="invoice_count"
              stroke="#7c3aed"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorOrders)"
              name="Invoices"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Issue Value</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                tickFormatter={(value) => format(parseISO(value), 'dd-MM-yyyy')}
              />
              <YAxis stroke="#6b7280" tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip
                labelFormatter={(value) => format(parseISO(value), 'dd-MM-yyyy')}
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="total_sales" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Invoices</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                tickFormatter={(value) => format(parseISO(value), 'dd-MM-yyyy')}
              />
              <YAxis stroke="#6b7280" />
              <Tooltip
                labelFormatter={(value) => format(parseISO(value), 'dd-MM-yyyy')}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="invoice_count"
                stroke="#7c3aed"
                strokeWidth={3}
                dot={{ fill: '#7c3aed', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// KPI Card Component
const KPICard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    purple: 'bg-purple-100 text-purple-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-bold">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
