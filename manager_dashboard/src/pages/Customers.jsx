import { useState, useEffect } from 'react';
import { crmAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiX,
  FiUsers,
  FiPhone,
  FiMail,
} from 'react-icons/fi';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    customer_type: 'retail',
    company_name: '',
    address: '',
    city: '',
    gst_number: '',
    credit_limit: '0',
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery]);

  const fetchCustomers = async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      
      const response = await crmAPI.getCustomers(params);
      setCustomers(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const viewCustomer = async (id) => {
    try {
      const response = await crmAPI.getCustomer(id);
      setSelectedCustomer(response.data);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to fetch customer details');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await crmAPI.updateCustomer(editingCustomer.id, formData);
        toast.success('Customer updated successfully');
      } else {
        await crmAPI.createCustomer(formData);
        toast.success('Customer created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save customer');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      customer_type: customer.customer_type,
      company_name: customer.company_name || '',
      address: customer.address || '',
      city: customer.city || '',
      gst_number: customer.gst_number || '',
      credit_limit: customer.credit_limit || '0',
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await crmAPI.deleteCustomer(id);
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      customer_type: 'retail',
      company_name: '',
      address: '',
      city: '',
      gst_number: '',
      credit_limit: '0',
      notes: '',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getCustomerTypeBadge = (type) => {
    const styles = {
      retail: 'bg-blue-100 text-blue-700',
      wholesale: 'bg-purple-100 text-purple-700',
      corporate: 'bg-green-100 text-green-700',
    };
    return styles[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Manage your customer database</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FiUsers className="w-16 h-16 mb-4" />
            <p className="text-lg">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total Purchases
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Outstanding
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      {customer.company_name && (
                        <p className="text-sm text-gray-500">{customer.company_name}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <FiPhone className="w-4 h-4" />
                        <span className="text-sm">{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center space-x-1 text-gray-500">
                          <FiMail className="w-4 h-4" />
                          <span className="text-sm">{customer.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getCustomerTypeBadge(
                          customer.customer_type
                        )}`}
                      >
                        {customer.customer_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(customer.total_purchases)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={
                          customer.outstanding_amount > 0
                            ? 'text-red-600 font-medium'
                            : 'text-gray-600'
                        }
                      >
                        {formatCurrency(customer.outstanding_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => viewCustomer(customer.id)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingCustomer ? 'Edit Customer' : 'Add Customer'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Type
                    </label>
                    <select
                      value={formData.customer_type}
                      onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={formData.gst_number}
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingCustomer ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Customer Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiUsers className="w-10 h-10 text-primary-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h4>
                {selectedCustomer.company_name && (
                  <p className="text-gray-500">{selectedCustomer.company_name}</p>
                )}
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium capitalize ${getCustomerTypeBadge(
                    selectedCustomer.customer_type
                  )}`}
                >
                  {selectedCustomer.customer_type}
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{selectedCustomer.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">City</p>
                    <p className="font-medium">{selectedCustomer.city || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">GST Number</p>
                    <p className="font-medium">{selectedCustomer.gst_number || '-'}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h5 className="font-medium text-gray-900 mb-3">Purchase Summary</h5>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedCustomer.total_orders}
                      </p>
                      <p className="text-xs text-gray-500">Total Orders</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedCustomer.total_purchases)}
                      </p>
                      <p className="text-xs text-gray-500">Total Purchases</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(selectedCustomer.outstanding_amount)}
                      </p>
                      <p className="text-xs text-gray-500">Outstanding</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
