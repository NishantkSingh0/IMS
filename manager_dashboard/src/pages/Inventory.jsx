import { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiPackage,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown,
  FiPlus,
  FiMinus,
  FiX,
  FiCheck,
} from 'react-icons/fi';

const Inventory = () => {
  const [stats, setStats] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: '',
    transaction_type: 'in',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, lowStockRes, alertsRes] = await Promise.all([
        inventoryAPI.getStats(),
        inventoryAPI.getLowStock(),
        inventoryAPI.getLowStockAlerts(),
      ]);

      setStats(statsRes.data);
      setLowStockProducts(lowStockRes.data);
      setAlerts(alertsRes.data);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.adjustStock(selectedProduct.id, adjustmentData);
      toast.success('Stock adjusted successfully');
      setShowAdjustModal(false);
      setSelectedProduct(null);
      setAdjustmentData({ quantity: '', transaction_type: 'in', notes: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to adjust stock');
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await inventoryAPI.acknowledgeAlert(alertId);
      toast.success('Alert acknowledged');
      setAlerts(alerts.filter((a) => a.id !== alertId));
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const openAdjustModal = (product) => {
    setSelectedProduct(product);
    setShowAdjustModal(true);
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-500">Monitor and manage your stock levels</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.active_products || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiPackage className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600">{stats?.low_stock_count || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiTrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats?.out_of_stock_count || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <FiAlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Stock Value</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.total_stock_value)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Products</h2>
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiTrendingUp className="w-12 h-12 mx-auto mb-2 text-green-400" />
              <p>All products are well stocked!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p
                      className={`font-semibold ${
                        product.current_stock === 0 ? 'text-red-600' : 'text-orange-600'
                      }`}
                    >
                      {product.current_stock} {product.unit}
                    </p>
                    <p className="text-xs text-gray-500">Min: {product.min_stock_level}</p>
                  </div>
                  <button
                    onClick={() => openAdjustModal(product)}
                    className="px-3 py-1.5 bg-black text-white text-sm rounded-lg hover:bg-black"
                  >
                    Adjust
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unacknowledged Alerts */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Alerts</h2>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiCheck className="w-12 h-12 mx-auto mb-2 text-green-400" />
              <p>No pending alerts</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                >
                  <div className="flex items-center space-x-3">
                    <FiAlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900">{alert.product_name}</p>
                      <p className="text-sm text-gray-500">
                        Current: {alert.current_stock} | Min: {alert.min_stock_level}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                    title="Acknowledge"
                  >
                    <FiCheck className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Adjust Stock</h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdjustStock} className="p-6">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                <p className="text-sm text-gray-500">Current Stock: {selectedProduct.current_stock} {selectedProduct.unit}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={adjustmentData.transaction_type}
                    onChange={(e) =>
                      setAdjustmentData({ ...adjustmentData, transaction_type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="in">Stock In (+)</option>
                    <option value="out">Stock Out (-)</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="damage">Damage</option>
                    <option value="return">Return</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={adjustmentData.quantity}
                    onChange={(e) =>
                      setAdjustmentData({ ...adjustmentData, quantity: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={adjustmentData.notes}
                    onChange={(e) =>
                      setAdjustmentData({ ...adjustmentData, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder="Reason for adjustment..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
