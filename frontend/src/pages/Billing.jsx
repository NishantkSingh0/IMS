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
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
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
        { id: 1, project_name: '2 Seater Sofa', created_by_name: 'Rajender Kumar' },
        { id: 2, project_name: 'Armchair', created_by_name: 'Rajender Kumar' },
        { id: 3, project_name: 'Aurora Bastien Bedside Night Table', created_by_name: 'Rajender Kumar' },
        { id: 4, project_name: 'Aurora VIA Lounge Chair', created_by_name: 'Rajender Kumar' },
        { id: 5, project_name: 'Aurora Vito Lounge Chair', created_by_name: 'Rajender Kumar' },
        { id: 6, project_name: 'Bar Back Cabinet', created_by_name: 'Rajender Kumar' },
        { id: 7, project_name: 'Bar Cabinet', created_by_name: 'Rajender Kumar' },
        { id: 8, project_name: 'Bar Counter', created_by_name: 'Rajender Kumar' },
        { id: 9, project_name: 'Bar Unit', created_by_name: 'Rajender Kumar' },
        { id: 10, project_name: 'Bastien Bed', created_by_name: 'Rajender Kumar' },
        { id: 11, project_name: 'Bastien Bedside Table', created_by_name: 'Rajender Kumar' },
        { id: 12, project_name: 'Bedside Table', created_by_name: 'Rajender Kumar' },
        { id: 13, project_name: 'Bench', created_by_name: 'Rajender Kumar' },
        { id: 14, project_name: 'Bowie 2 Seater Sofa', created_by_name: 'Rajender Kumar' },
        { id: 15, project_name: 'Bowie Coffee Table', created_by_name: 'Rajender Kumar' },
        { id: 16, project_name: 'Bowie Tall Baack Chair', created_by_name: 'Rajender Kumar' },
        { id: 17, project_name: 'Bowie Tall Back Chair', created_by_name: 'Rajender Kumar' },
        { id: 18, project_name: 'Bowie Tall Baack Chair', created_by_name: 'Rajender Kumar' },
        { id: 19, project_name: 'Bowie Bed-king hydraulic', created_by_name: 'Rajender Kumar' },
        { id: 20, project_name: 'Buffet Counter 001 B', created_by_name: 'Rajender Kumar' },
        { id: 21, project_name: 'Buffet Counter 001A', created_by_name: 'Rajender Kumar' },
        { id: 22, project_name: 'Buffet Counter 001B', created_by_name: 'Rajender Kumar' },
        { id: 23, project_name: 'Cabinet', created_by_name: 'Rajender Kumar' },
        { id: 24, project_name: 'Cabinet 001', created_by_name: 'Rajender Kumar' },
        { id: 25, project_name: 'Center Table', created_by_name: 'Rajender Kumar' },
        { id: 26, project_name: 'Center Table 001A', created_by_name: 'Rajender Kumar' },
        { id: 27, project_name: 'Center Table 001B', created_by_name: 'Rajender Kumar' },
        { id: 28, project_name: 'Chaise', created_by_name: 'Rajender Kumar' },
        { id: 29, project_name: 'Chair 001', created_by_name: 'Rajender Kumar' },
        { id: 30, project_name: 'Chair 001 Kids Room', created_by_name: 'Rajender Kumar' },
        { id: 31, project_name: 'Chair 002', created_by_name: 'Rajender Kumar' },
        { id: 32, project_name: 'Chair 004', created_by_name: 'Rajender Kumar' },
        { id: 33, project_name: 'Coffe Table Oval Veneer', created_by_name: 'Rajender Kumar' },
        { id: 34, project_name: 'Coffee Table', created_by_name: 'Rajender Kumar' },
        { id: 35, project_name: 'Coffee Table 001', created_by_name: 'Rajender Kumar' },
        { id: 36, project_name: 'Coffee Table 002', created_by_name: 'Rajender Kumar' },
        { id: 37, project_name: 'Coffee Table Oval Capsule', created_by_name: 'Rajender Kumar' },
        { id: 38, project_name: 'Console 001', created_by_name: 'Rajender Kumar' },
        { id: 39, project_name: 'Deck Bar Table', created_by_name: 'Rajender Kumar' },
        { id: 40, project_name: 'Deck Console', created_by_name: 'Rajender Kumar' },
        { id: 41, project_name: 'Desk Chair with Metal Legs', created_by_name: 'Rajender Kumar' },
        { id: 42, project_name: 'DESK', created_by_name: 'Rajender Kumar' },
        { id: 43, project_name: 'Dining Chair', created_by_name: 'Rajender Kumar' },
        { id: 44, project_name: 'Dining Table', created_by_name: 'Rajender Kumar' },
        { id: 45, project_name: 'DJ Counter', created_by_name: 'Rajender Kumar' },
        { id: 46, project_name: 'Easy Chair', created_by_name: 'Rajender Kumar' },
        { id: 47, project_name: 'Easy Chair-001', created_by_name: 'Rajender Kumar' },
        { id: 48, project_name: 'Falcon Side Table', created_by_name: 'Rajender Kumar' },
        { id: 49, project_name: 'Fifties Low Cabinet', created_by_name: 'Rajender Kumar' },
        { id: 50, project_name: 'Fifties Night Table', created_by_name: 'Rajender Kumar' },
        { id: 51, project_name: 'Fifties Sofa', created_by_name: 'Rajender Kumar' },
        { id: 52, project_name: 'Forma Side Table', created_by_name: 'Rajender Kumar' },
        { id: 53, project_name: 'Hanging Unit 001', created_by_name: 'Rajender Kumar' },
        { id: 54, project_name: 'Harper Easy Chair', created_by_name: 'Rajender Kumar' },
        { id: 55, project_name: 'Harper Side Table', created_by_name: 'Rajender Kumar' },
        { id: 56, project_name: 'Harper Side Table 004', created_by_name: 'Rajender Kumar' },
        { id: 57, project_name: 'Harper Sofa (F2)', created_by_name: 'Rajender Kumar' },
        { id: 58, project_name: 'Harper Sofa (F3)', created_by_name: 'Rajender Kumar' },
        { id: 59, project_name: 'Harper Sofa(F1)', created_by_name: 'Rajender Kumar' },
        { id: 60, project_name: 'HIGH COFFEE TABLE', created_by_name: 'Rajender Kumar' },
        { id: 61, project_name: 'LOW COFFEE TABLE', created_by_name: 'Rajender Kumar' },
        { id: 62, project_name: 'Low Back Chair', created_by_name: 'Rajender Kumar' },
        { id: 63, project_name: 'LOW CABINET', created_by_name: 'Rajender Kumar' },
        { id: 64, project_name: 'Marco Back High Chair', created_by_name: 'Rajender Kumar' },
        { id: 65, project_name: 'Marco Fixed Sofa', created_by_name: 'Rajender Kumar' },
        { id: 66, project_name: 'Marco wing Back Chair', created_by_name: 'Rajender Kumar' },
        { id: 67, project_name: 'Mirror 001', created_by_name: 'Rajender Kumar' },
        { id: 68, project_name: 'Mirror 001A', created_by_name: 'Rajender Kumar' },
        { id: 69, project_name: 'Mirror 002', created_by_name: 'Rajender Kumar' },
        { id: 70, project_name: 'Mirror 003', created_by_name: 'Rajender Kumar' },
        { id: 71, project_name: 'Mirror 004', created_by_name: 'Rajender Kumar' },
        { id: 72, project_name: 'Mirror 005', created_by_name: 'Rajender Kumar' },
        { id: 73, project_name: 'MNZ Coffee Table', created_by_name: 'Rajender Kumar' },
        { id: 74, project_name: 'MNZ Marco Modular Sofa', created_by_name: 'Rajender Kumar' },
        { id: 75, project_name: 'MNZ Pouf with Tray', created_by_name: 'Rajender Kumar' },
        { id: 76, project_name: 'MNZ Relax Chair', created_by_name: 'Rajender Kumar' },
        { id: 77, project_name: 'MNZ Side Table', created_by_name: 'Rajender Kumar' },
        { id: 78, project_name: 'Mound Cabinet', created_by_name: 'Rajender Kumar' },
        { id: 79, project_name: 'Nayora Bedside Table', created_by_name: 'Rajender Kumar' },
        { id: 80, project_name: 'Nayora Dining Cabinet', created_by_name: 'Rajender Kumar' },
        { id: 81, project_name: 'Nelson Night Table', created_by_name: 'Rajender Kumar' },
        { id: 82, project_name: 'Night Table', created_by_name: 'Rajender Kumar' },
        { id: 83, project_name: 'NIGHT TABLE', created_by_name: 'Rajender Kumar' },
        { id: 84, project_name: 'Nova Bookshelf', created_by_name: 'Rajender Kumar' },
        { id: 85, project_name: 'Oval Side Table', created_by_name: 'Rajender Kumar' },
        { id: 86, project_name: 'Pillar Side Table', created_by_name: 'Rajender Kumar' },
        { id: 87, project_name: 'POUF', created_by_name: 'Rajender Kumar' },
        { id: 88, project_name: 'Pouf', created_by_name: 'Rajender Kumar' },
        { id: 89, project_name: 'Shelving 001', created_by_name: 'Rajender Kumar' },
        { id: 90, project_name: 'Shelving 001 A LHS', created_by_name: 'Rajender Kumar' },
        { id: 91, project_name: 'Shelving 001 B RHS', created_by_name: 'Rajender Kumar' },
        { id: 92, project_name: 'Side Table', created_by_name: 'Rajender Kumar' },
        { id: 93, project_name: 'Side Table Big', created_by_name: 'Rajender Kumar' },
        { id: 94, project_name: 'Side Table Small', created_by_name: 'Rajender Kumar' },
        { id: 95, project_name: 'SOFA', created_by_name: 'Rajender Kumar' },
        { id: 96, project_name: 'Sparks 2 Seater Sofa', created_by_name: 'Rajender Kumar' },
        { id: 97, project_name: 'Sparks 3 Seater Sofa', created_by_name: 'Rajender Kumar' },
        { id: 98, project_name: 'Sparks 3 Seater Sofa', created_by_name: 'Rajender Kumar' },
        { id: 99, project_name: 'Sparks Coffee Table Round', created_by_name: 'Rajender Kumar' },
        { id: 100, project_name: 'Sparks Dining Table', created_by_name: 'Rajender Kumar' },
        { id: 101, project_name: 'Sparks Low Side Table', created_by_name: 'Rajender Kumar' },
        { id: 102, project_name: 'Sparks Relax Chair', created_by_name: 'Rajender Kumar' },
        { id: 103, project_name: 'Sparks Side Table High', created_by_name: 'Rajender Kumar' },
        { id: 104, project_name: 'Sparks Side Table Low', created_by_name: 'Rajender Kumar' },
        { id: 105, project_name: 'Sparks Swivel Lounge Chair', created_by_name: 'Rajender Kumar' },
        { id: 106, project_name: 'Sparks Swivel Lounge Chair Legs', created_by_name: 'Rajender Kumar' },
        { id: 107, project_name: 'Swivel Dining Chair', created_by_name: 'Rajender Kumar' },
        { id: 108, project_name: 'Swivel Lounge Chair', created_by_name: 'Rajender Kumar' },
        { id: 109, project_name: 'Tall Back Chair', created_by_name: 'Rajender Kumar' },
        { id: 110, project_name: 'The Mound Collection C Table', created_by_name: 'Rajender Kumar' },
        { id: 111, project_name: 'The Mound Collection Coffee Table', created_by_name: 'Rajender Kumar' },
        { id: 112, project_name: 'The Mound Collection Dining Table', created_by_name: 'Rajender Kumar' },
        { id: 113, project_name: 'The Mound Collection Side Table', created_by_name: 'Rajender Kumar' },
        { id: 114, project_name: 'Trolly 001', created_by_name: 'Rajender Kumar' },
        { id: 115, project_name: 'TV Cabinet 001', created_by_name: 'Rajender Kumar' },
        { id: 116, project_name: 'TV Cabinet 002', created_by_name: 'Rajender Kumar' },
        { id: 117, project_name: 'TV Cabinet 006', created_by_name: 'Rajender Kumar' },
        { id: 118, project_name: 'Vanity 001', created_by_name: 'Rajender Kumar' },
        { id: 119, project_name: 'Vanity 01', created_by_name: 'Rajender Kumar' },
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

  const areAllItemsConsumable = () => {
    if (cart.length === 0) return false;
    return cart.every(item => item.product.category_name === 'CONSUMABLE');
  };

  const hasNonConsumableItems = () => {
    return cart.some(item => item.product.category_name !== 'CONSUMABLE');
  };

  const hasAnyConsumableItems = () => {
    return cart.some(item => item.product.category_name === 'CONSUMABLE');
  };

  const calculateSubtotal = () => {
    return cart.reduce(
      (sum, item) => sum + item.product.cost_price * item.quantity - item.discount,
      0
    );
  };

  const calculateTax = () => {
    return cart.reduce((sum, item) => {
      const itemTotal = item.product.cost_price * item.quantity - item.discount;
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

    // Check if project selection is mandatory (has non-consumable items)
    if (hasNonConsumableItems() && !selectedProject) {
      toast.error('Please select a project');
      return;
    }

    setLoading(true);
    try {
      let projectName, projectCreatedBy;

      // If all items are consumable, use default values
      if (areAllItemsConsumable()) {
        projectName = 'CONSUMABLE PRODUCT';
        projectCreatedBy = '-';
      } else {
        // Find the selected project to get created_by_name
        const project = projects.find(p => p.project_name === selectedProject || p.id === selectedProject);
        projectName = project?.project_name || selectedProject;
        projectCreatedBy = project?.created_by_name || '';
      }
      
      const invoiceData = {
        department_id: parseInt(selectedDepartment),
        project_name: projectName,
        project_created_by: projectCreatedBy,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.cost_price,
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
      setProjectSearchQuery('');
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

  const filteredProjects = projects
    .filter((project) =>
      project.project_name.toLowerCase().includes(projectSearchQuery.toLowerCase())
    )
    .slice(0, 5);

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
              placeholder="Search by name, SKU, or Tally name"
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
                      {product.category_name === 'CONSUMABLE' && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                          Consumable
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(product.cost_price)}
                      </p>
                      <p className={`text-sm ${product.current_stock > (product.min_stock_level || 10) ? 'text-green-600' : 'text-orange-600'}`}>
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
                      {item.product.category_name === 'CONSUMABLE' && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                          Consumable
                        </span>
                      )}
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
                      {formatCurrency(item.product.cost_price)}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {formatCurrency(item.product.cost_price * item.quantity - item.discount)}
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
          {hasAnyConsumableItems() && hasNonConsumableItems() && (
            <div className="mt-4 p-3 bg-red-100 border border-red-500 rounded-lg">
              <p className="text-sm text-red-500 text-center">
                Cart cannot mix Consumable and Non-Consumable items together. To Ensure Accurate Billing
              </p>
            </div>
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
            Project {hasNonConsumableItems() && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            {projectSearchQuery && <FiFolder className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />}
            <input
              type="text"
              value={projectSearchQuery}
              onChange={(e) => setProjectSearchQuery(e.target.value)}
              placeholder="Search project..."
              disabled={areAllItemsConsumable()}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:shadow-sm transition-shadow ${
                areAllItemsConsumable() 
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300'
              }`}
            />
            {projectSearchQuery && filteredProjects.length > 0 && !areAllItemsConsumable() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id || project.project_name}
                    onClick={() => {
                      setSelectedProject(project.project_name);
                      setProjectSearchQuery('');
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gradient-to-r hover:from-primary-50 hover:to-blue-50 border-b last:border-b-0 transition-colors"
                  >
                    <div className="text-left flex items-center space-x-3">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <FiFolder className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{project.project_name}</p>
                        {project.created_by_name && (
                          <p className="text-sm text-gray-500">by {project.created_by_name}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {projectSearchQuery && filteredProjects.length === 0 && !areAllItemsConsumable() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="px-4 py-3 text-center text-gray-500 text-sm">
                  No projects found matching "{projectSearchQuery}"
                </div>
              </div>
            )}
            {selectedProject && !projectSearchQuery && !areAllItemsConsumable() && (
              <div className="mt-3 flex items-center justify-between bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 px-4 py-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <FiFolder className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedProject}</p>
                    {projects.find(p => p.project_name === selectedProject)?.created_by_name && (
                      <p className="text-xs text-gray-500">
                        by {projects.find(p => p.project_name === selectedProject)?.created_by_name}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject('')}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  title="Clear selection"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            {areAllItemsConsumable() && cart.length > 0 && (
              <div className="mt-3 flex items-center justify-between bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <FiFolder className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500">CONSUMABLE PRODUCT</p>
                  </div>
                </div>
              </div>
            )}
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
            disabled={cart.length === 0 || !selectedDepartment || (hasNonConsumableItems() && !selectedProject) || (hasAnyConsumableItems() && hasNonConsumableItems()) || loading}
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
