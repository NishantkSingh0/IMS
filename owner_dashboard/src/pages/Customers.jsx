import { useState, useEffect } from 'react';
import { crmAPI } from '../services/api';
import {
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
} from 'recharts';
import {
  FiUsers,
  FiDollarSign,
  FiUserPlus,
  FiAlertCircle,
  FiPhone,
  FiMail,
} from 'react-icons/fi';

const Customers = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [topCustomers, setTopCustomers] = useState([]);
  const [customersWithOutstanding, setCustomersWithOutstanding] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      const [statsRes, topCustomersRes, outstandingRes, customersRes] = await Promise.all([
        crmAPI.getStats(),
        crmAPI.getTopCustomers({ limit: 10 }),
        crmAPI.getWithOutstanding(),
        crmAPI.getCustomers({ ordering: '-total_purchases', page_size: 50 }),
      ]);

      setStats(statsRes.data);
      setTopCustomers(topCustomersRes.data || []);
      setCustomersWithOutstanding(outstandingRes.data || []);
      setCustomers(customersRes.data?.results || customersRes.data || []);
    } catch (error) {
      console.error('Error fetching customer data:', error);
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

  const COLORS = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b'];

  // Customer type distribution
  const customerTypeData = [
    { name: 'Retail', value: customers.filter((c) => c.customer_type === 'retail').length },
    { name: 'Wholesale', value: customers.filter((c) => c.customer_type === 'wholesale').length },
    { name: 'Corporate', value: customers.filter((c) => c.customer_type === 'corporate').length },
  ].filter((d) => d.value > 0);

  const getCustomerTypeBadge = (type) => {
    const styles = {
      retail: 'bg-blue-100 text-blue-700',
      wholesale: 'bg-purple-100 text-purple-700',
      corporate: 'bg-green-100 text-green-700',
    };
    return styles[type] || 'bg-gray-100 text-gray-700';
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Insights</h1>
        <p className="text-gray-500">Analyze your customer base and relationships</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={stats?.total_customers || 0}
          icon={FiUsers}
          color="indigo"
        />
        <StatCard
          title="New This Month"
          value={stats?.new_this_month || 0}
          icon={FiUserPlus}
          color="green"
        />
        <StatCard
          title="Total Purchases"
          value={formatCurrency(stats?.total_purchases)}
          icon={FiDollarSign}
          color="purple"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats?.total_outstanding)}
          icon={FiAlertCircle}
          color="red"
          alert={stats?.total_outstanding > 0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Customers by Purchases</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCustomers.slice(0, 8)} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" tickFormatter={(v) => `₹${v / 1000}k`} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#6b7280"
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="total_purchases" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Type Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Type Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={customerTypeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {customerTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${getCustomerTypeBadge(customer.customer_type)}`}>
                        {customer.customer_type}
                      </span>
                      <span>• {customer.total_orders} orders</span>
                    </div>
                  </div>
                </div>
                <p className="font-semibold text-indigo-600">
                  {formatCurrency(customer.total_purchases)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Customers with Outstanding */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FiAlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Outstanding Payments</h2>
          </div>
          {customersWithOutstanding.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiDollarSign className="w-12 h-12 mx-auto mb-2 text-green-400" />
              <p>No outstanding payments!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {customersWithOutstanding.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <FiPhone className="w-3 h-3" />
                      <span>{customer.phone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      {formatCurrency(customer.outstanding_amount)}
                    </p>
                    <p className="text-xs text-gray-500">outstanding</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, alert }) => {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {alert && <FiAlertCircle className="w-5 h-5 text-red-500" />}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default Customers;
