import { useState, useEffect, useRef } from 'react';
import { inventoryAPI, salesAPI, projectsAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiShoppingCart,
  FiBriefcase,
  FiPercent,
  FiFolder,
} from 'react-icons/fi';

const Billing = () => {
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchDepartments();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      fetchSearchResults(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchSearchResults = async (query) => {
    try {
      const response = await inventoryAPI.getProducts({ search: query, page_size: 10 });
      const results = response.data.results || response.data;
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    }
  };

  const selectedDepartmentData = departments.find(
    (department) => department.id.toString() === selectedDepartment
  );

  const fetchDepartments = async () => {
    try {
      const response = await inventoryAPI.getDepartments({ is_active: true });
      setDepartments(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      // TEMPORARY: Hardcoded projects for testing
      // const response = await projectsAPI.getProjects();
      // const projectsData = response.data.results || response.data || [];
      
      const hardcodedProjects = [
        { id: 1, project_name: 'NELSON BED', created_by_name: 'Nishant Kumar' },
        { id: 2, project_name: 'Harper Sofa (Fabric2)', created_by_name: 'BOT' },
        { id: 3, project_name: 'NOVA BOOKSHELF', created_by_name: 'BOT' },
        { id: 4, project_name: 'RELAX CHAIR', created_by_name: 'BOT' },
        { id: 5, project_name: 'NIGHT TABLE', created_by_name: 'BOT' },
        { id: 6, project_name: 'LOW CABINET', created_by_name: 'BOT' },
        { id: 7, project_name: 'MNZ POUF WITH TRAY', created_by_name: 'Aditi marchanda' },
        { id: 8, project_name: 'BASTIEN BED SIDE NIGHT TABLE', created_by_name: 'Rajender Kumar' },
      ];
      
      setProjects(hardcodedProjects);
      
      // Original external API call (commented out for testing)
      // const response = await projectsAPI.getProjects();
      // const projectsData = response.data.results || response.data || [];
      // setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.current_stock) {
        toast.error('Not enough stock available');
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      if (product.current_stock < 1) {
        toast.error('Product is out of stock');
        return;
      }
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }
    
    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    const item = cart.find((i) => i.product.id === productId);
    if (newQuantity > item.product.current_stock) {
      toast.error('Not enough stock available');
      return;
    }
    
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const updateItemDiscount = (productId, discountAmount) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? { ...item, discount: parseFloat(discountAmount) || 0 }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce(
      (sum, item) => sum + item.product.selling_price * item.quantity - item.discount,
      0
    );
  };

  const calculateTax = () => {
    return cart.reduce((sum, item) => {
      const itemTotal = item.product.selling_price * item.quantity - item.discount;
      return sum + itemTotal * (item.product.gst_rate || 18) / 100;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const discountAmount = subtotal * (discount / 100);
    return subtotal + tax - discountAmount;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!selectedDepartment) {
      toast.error('Please select a department');
      return;
    }

    if (!selectedProject) {
      toast.error('Please select a project');
      return;
    }

    setLoading(true);
    try {
      // Find the selected project to get created_by_name
      const project = projects.find(p => p.project_name === selectedProject || p.id === selectedProject);
      
      const invoiceData = {
        department_id: parseInt(selectedDepartment),
        project_name: project?.project_name || selectedProject,
        project_created_by: project?.created_by_name || '',
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
          discount: item.discount,
        })),
        discount_percentage: discount,
      };

      const response = await salesAPI.createInvoice(invoiceData);
      toast.success(`${response.data.invoice_number} created successfully!`);
      
      // Reset
      setCart([]);
      setSelectedDepartment('');
      setSelectedProject('');
      setDiscount(0);
      searchInputRef.current?.focus();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Left Panel - Product Search & Cart */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(product.selling_price)}
                      </p>
                      <p className={`text-sm ${product.current_stock > 10 ? 'text-green-600' : 'text-orange-600'}`}>
                        Stock: {product.current_stock}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <FiSearch className="w-16 h-16 mb-4" />
              <p className="text-lg">Search and add products to cart</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium text-center">Qty</th>
                  <th className="pb-3 font-medium text-right">Price</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cart.map((item) => (
                  <tr key={item.product.id}>
                    <td className="py-3">
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-500">{item.product.sku}</p>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 rounded-lg hover:bg-gray-100"
                        >
                          <FiMinus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.product.id, parseInt(e.target.value) || 0)
                          }
                          className="w-12 text-center border rounded-lg py-1"
                          min="1"
                        />
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 rounded-lg hover:bg-gray-100"
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-900">
                      {formatCurrency(item.product.selling_price)}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {formatCurrency(item.product.selling_price * item.quantity - item.discount)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right Panel - Summary & Checkout */}
      <div className="w-96 bg-white rounded-xl shadow-sm flex flex-col">
        {/* Department Selection */}
        <div className="p-4 border-b">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <div className="relative">
            <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select Department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name} ({department.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Project Selection */}
        <div className="p-4 border-b">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>
          <div className="relative">
            <FiFolder className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project.id || project.project_name} value={project.project_name}>
                  {project.project_name} {project.created_by_name ? `(by ${project.created_by_name})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Order Summary */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900">Order Summary</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">{formatCurrency(calculateSubtotal())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tax (GST)</span>
              <span className="text-gray-900">{formatCurrency(calculateTax())}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Discount</span>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-16 text-right border rounded-lg px-2 py-1 bg-gray-200 text-gray-500 cursor-not-allowed"
                  min="0"
                  disabled
                  max="100"
                />
                <FiPercent className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary-600">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </div>

        {/* Checkout Buttons */}
        <div className="p-4 border-t space-y-3">
          <p className="text-xs flex items-center justify-center">
            Each Transaction is Recorded and Accessible to Admin
          </p>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || !selectedDepartment || !selectedProject || loading}
            className="w-full flex items-center justify-center space-x-2 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiShoppingCart className="w-5 h-5" />
            <span>{loading ? 'Processing...' : selectedDepartment ? `Issue to ${selectedDepartmentData?.name}` : 'Issue to Department'}</span>
          </button>
          <button
            onClick={() => setCart([])}
            disabled={cart.length === 0}
            className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            <FiTrash2 className="w-5 h-5" />
            <span>Clear Cart</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default Billing;
