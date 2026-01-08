import { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';
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
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FiPackage,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown,
  FiLayers,
  FiDollarSign,
} from 'react-icons/fi';

const Inventory = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const [statsRes, lowStockRes, outOfStockRes, categoriesRes, productsRes] = await Promise.all([
        inventoryAPI.getStats(),
        inventoryAPI.getLowStock(),
        inventoryAPI.getOutOfStock(),
        inventoryAPI.getCategories(),
        inventoryAPI.getProducts({ ordering: '-current_stock', page_size: 10 }),
      ]);

      setStats(statsRes.data);
      setLowStockProducts(lowStockRes.data?.results || lowStockRes.data || []);
      setOutOfStockProducts(outOfStockRes.data?.results || outOfStockRes.data || []);
      setCategories(categoriesRes.data?.results || categoriesRes.data || []);
      setProducts(productsRes.data?.results || productsRes.data || []);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
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

  const COLORS = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  // Prepare category distribution data
  const categoryData = categories.map((cat) => ({
    name: cat.name,
    count: cat.product_count || 0,
  }));

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
        <h1 className="text-2xl font-bold text-gray-900">Inventory Overview</h1>
        <p className="text-gray-500">Monitor your stock levels and inventory health</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats?.active_products || 0}
          icon={FiPackage}
          color="indigo"
        />
        <StatCard
          title="Low Stock"
          value={stats?.low_stock_count || 0}
          icon={FiTrendingDown}
          color="orange"
          alert={stats?.low_stock_count > 0}
        />
        <StatCard
          title="Out of Stock"
          value={stats?.out_of_stock_count || 0}
          icon={FiAlertTriangle}
          color="red"
          alert={stats?.out_of_stock_count > 0}
        />
        <StatCard
          title="Stock Value"
          value={formatCurrency(stats?.total_stock_value)}
          icon={FiDollarSign}
          color="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Products by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="count"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Levels */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Levels Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={products.slice(0, 8)}
              layout="vertical"
              margin={{ left: 80, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="name" type="category" stroke="#6b7280" width={80} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="current_stock" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Current Stock" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alert Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FiTrendingDown className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Products</h2>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiTrendingUp className="w-12 h-12 mx-auto mb-2 text-green-400" />
              <p>All products are well stocked!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">
                      {product.current_stock} {product.unit}
                    </p>
                    <p className="text-xs text-gray-500">Min: {product.min_stock_level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Out of Stock Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FiAlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Out of Stock Products</h2>
          </div>
          {outOfStockProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiPackage className="w-12 h-12 mx-auto mb-2 text-green-400" />
              <p>No products are out of stock!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {outOfStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">OUT OF STOCK</p>
                    <p className="text-xs text-gray-500">Min: {product.min_stock_level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Categories Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100"
            >
              <p className="font-medium text-gray-900">{category.name}</p>
              <p className="text-2xl font-bold text-indigo-600">{category.product_count || 0}</p>
              <p className="text-xs text-gray-500">products</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, alert }) => {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {alert && <FiAlertTriangle className="w-5 h-5 text-red-500" />}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default Inventory;
