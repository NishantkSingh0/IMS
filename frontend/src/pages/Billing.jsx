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
        { id: 1, project_name: '73-26 / MNZ Side Table', created_by_name: 'Aditi Manchanda' },
        { id: 2, project_name: '110-26 / Fifties Night Table', created_by_name: 'Aditi Manchanda' },
        { id: 3, project_name: '110-26 / Nelson Night Table', created_by_name: 'Aditi Manchanda' },
        { id: 4, project_name: '311-26 / Bar Counter', created_by_name: 'Aditi Manchanda' },
        { id: 5, project_name: '384-26 / Trolly 001', created_by_name: 'Aditi Manchanda' },
        { id: 6, project_name: '127-26 / Lounge Chair Open Back', created_by_name: 'Aditi Manchanda' },
        { id: 7, project_name: '127-26 / Harper Easy Chair', created_by_name: 'Aditi Manchanda' },
        { id: 8, project_name: '127-26 / Harper Side Table', created_by_name: 'Aditi Manchanda' },
        { id: 9, project_name: '110-26 / Sparks Coffee Table Round', created_by_name: 'Aditi Manchanda' },
        { id: 10, project_name: '110-26 / Aurora VIA Lounge Chair', created_by_name: 'Aditi Manchanda' },
        { id: 11, project_name: '110-26 / Bowie 2 Seater Sofa', created_by_name: 'Aditi Manchanda' },
        { id: 12, project_name: '110-26 / Aurora Vito Lounge Chair', created_by_name: 'Aditi Manchanda' },
        { id: 13, project_name: '110-26 / Fifties Low Cabinet', created_by_name: 'Aditi Manchanda' },
        { id: 14, project_name: '110-26 / Bowie Tall Baack Chair', created_by_name: 'Aditi Manchanda' },
        { id: 15, project_name: '110-26 / MNZ Pouf with Tray', created_by_name: 'Aditi Manchanda' },
        { id: 16, project_name: '356-26 / Easy Chair-001', created_by_name: 'Aditi Manchanda' },
        { id: 17, project_name: '85-26 / Night Table', created_by_name: 'Aditi Manchanda' },
        { id: 18, project_name: '85-26 / Bench', created_by_name: 'Aditi Manchanda' },
        { id: 19, project_name: '85-26 / Cabinet', created_by_name: 'Aditi Manchanda' },
        { id: 20, project_name: '85-26 / Swivel Lounge Chair', created_by_name: 'Aditi Manchanda' },
        { id: 21, project_name: '85-26 / Tall Back Chair', created_by_name: 'Aditi Manchanda' },
        { id: 22, project_name: '85-26 / Desk Chair with Metal Legs', created_by_name: 'Aditi Manchanda' },
        { id: 23, project_name: '85-26 / DESK', created_by_name: 'Aditi Manchanda' },
        { id: 24, project_name: '127-26 / Sparks Low Side Table', created_by_name: 'Aditi Manchanda' },
        { id: 25, project_name: '127-26 / Dining Table', created_by_name: 'Aditi Manchanda' },
        { id: 26, project_name: '127-26 / Sparks 3 Seater Sofa', created_by_name: 'Aditi Manchanda' },
        { id: 27, project_name: '127-26 / Coffee Table Oval Veneer', created_by_name: 'Aditi Manchanda' },
        { id: 28, project_name: '156-26 / Console', created_by_name: 'Aditi Manchanda' },
        { id: 29, project_name: '89-26 / Console 001', created_by_name: 'Rajender Kumar' },
        { id: 30, project_name: '89-26 / TV Cabinet 001', created_by_name: 'Rajender Kumar' },
        { id: 31, project_name: '89-26 / TV Cabinet 002', created_by_name: 'Rajender Kumar' },
        { id: 32, project_name: '89-26 / Center Table', created_by_name: 'Rajender Kumar' },
        { id: 33, project_name: '65-26 / Mirror 004', created_by_name: 'Rajender Kumar' },
        { id: 34, project_name: '65-26 / Mirror 002', created_by_name: 'Rajender Kumar' },
        { id: 35, project_name: '65-26 / Vanity 01', created_by_name: 'Rajender Kumar' },
        { id: 36, project_name: '65-26 / Coffee Table 002', created_by_name: 'Rajender Kumar' },
        { id: 37, project_name: '89-26 / Shoe Cabinet', created_by_name: 'Rajender Kumar' },
        { id: 38, project_name: '141-26 / Sparks 3 Seater Sofa', created_by_name: 'Rajender Kumar' },
        { id: 39, project_name: '141-26 / Sparks Coffee Table Round', created_by_name: 'Rajender Kumar' },
        { id: 40, project_name: '141-26 / Harper Side Table', created_by_name: 'Rajender Kumar' },
        { id: 41, project_name: '141-26 / Bowie Swivel Lounge Chair', created_by_name: 'Rajender Kumar' },
        { id: 42, project_name: '141-26 / Nelson Side Table', created_by_name: 'Rajender Kumar' },
        { id: 43, project_name: '141-26 / Nayora Dining Table', created_by_name: 'Rajender Kumar' },
        { id: 44, project_name: '141-26 / Harper Swivel Dining Chair', created_by_name: 'Rajender Kumar' },
        { id: 45, project_name: '141-26 / Mound Cabinet', created_by_name: 'Rajender Kumar' },
        { id: 46, project_name: '141-26 / Mound Bar Cabinet', created_by_name: 'Rajender Kumar' },
        { id: 47, project_name: '141-26 / Mound Sofa(Brass)', created_by_name: 'Rajender Kumar' },
        { id: 48, project_name: '141-26 / Mound Lounge Chair', created_by_name: 'Rajender Kumar' },
        { id: 49, project_name: '141-26 / Mound Coffee Table', created_by_name: 'Rajender Kumar' },
        { id: 50, project_name: '141-26 / Mound Side Table', created_by_name: 'Rajender Kumar' },
        { id: 51, project_name: '73-26 / MNZ Pouf with Tray', created_by_name: 'Rajender Kumar' },
        { id: 52, project_name: '151-26 / Fifties Sofa', created_by_name: 'Rajender Kumar' },
        { id: 53, project_name: '151-26 / Sparks Relax Chair', created_by_name: 'Rajender Kumar' },
        { id: 54, project_name: '131-26 / Ottoman', created_by_name: 'Rajender Kumar' },
        { id: 55, project_name: '143-26 / Aurora Regsi Bed', created_by_name: 'Rajender Kumar' },
        { id: 56, project_name: '56-26 / Harper Swivel Dining Chair', created_by_name: 'Rajender Kumar' },
        { id: 57, project_name: '56-26 / Sparks Dining Table', created_by_name: 'Rajender Kumar' },
        { id: 58, project_name: '121-26 / Bar Unit', created_by_name: 'Rajender Kumar' },
        { id: 59, project_name: '95-26 / HIGH COFFEE TABLE', created_by_name: 'Rajender Kumar' },
        { id: 60, project_name: '95-26 / LOW COFFEE TABLE', created_by_name: 'Rajender Kumar' },
        { id: 61, project_name: '95-26 / SIDE TABLE', created_by_name: 'Rajender Kumar' },
        { id: 62, project_name: '95-26 / POUF', created_by_name: 'Rajender Kumar' },
        { id: 63, project_name: '95-26 / SOFA', created_by_name: 'Rajender Kumar' },
        { id: 64, project_name: '95-26 / RELAX CHAIR', created_by_name: 'Rajender Kumar' },
        { id: 65, project_name: '95-26 / BED (KING SIZE) - REMOTE', created_by_name: 'Rajender Kumar' },
        { id: 66, project_name: '95-26 / NIGHT TABLE', created_by_name: 'Rajender Kumar' },
        { id: 67, project_name: '95-26 / LOW CABINET', created_by_name: 'Rajender Kumar' },
        { id: 68, project_name: '95-26 / DINING TABLE', created_by_name: 'Rajender Kumar' },
        { id: 69, project_name: '95-26 / SWIVEL DINING CHAIR', created_by_name: 'Rajender Kumar' },
        { id: 70, project_name: '95-26 / BAR CABINET', created_by_name: 'Rajender Kumar' },
        { id: 71, project_name: '95-26 / EASY CHAIR', created_by_name: 'Rajender Kumar' },
        { id: 72, project_name: '95-26 / Chaise', created_by_name: 'Rajender Kumar' },
        { id: 73, project_name: '95-26 / Side Table', created_by_name: 'Rajender Kumar' },
        { id: 74, project_name: '70-26 / Deck Console', created_by_name: 'Rajender Kumar' },
        { id: 75, project_name: '70-26 / Dining Table', created_by_name: 'Rajender Kumar' },
        { id: 76, project_name: '70-26 / Deck Bar Table', created_by_name: 'Rajender Kumar' },
        { id: 77, project_name: '124-26 / Harper Side Table', created_by_name: 'Rajender Kumar' },
        { id: 78, project_name: '124-26 / Bowie Coffee Table', created_by_name: 'Rajender Kumar' },
        { id: 79, project_name: '124-26 / 2 Seater Sofa', created_by_name: 'Rajender Kumar' },
        { id: 80, project_name: '124-26 / Bowie Tall Back Chair', created_by_name: 'Rajender Kumar' },
        { id: 81, project_name: '124-26 / Bastien Bed', created_by_name: 'Rajender Kumar' },
        { id: 82, project_name: '124-26 / Bastien Bedside Table', created_by_name: 'Rajender Kumar' },
        { id: 83, project_name: '126-26 / Nyora Sofa', created_by_name: 'Rajender Kumar' },
        { id: 84, project_name: '126-26 / Lounge Chair', created_by_name: 'Rajender Kumar' },
        { id: 85, project_name: '78-26 / Low Back Chair', created_by_name: 'Rajender Kumar' },
        { id: 86, project_name: '78-26 / Oval Side Table', created_by_name: 'Rajender Kumar' },
        { id: 87, project_name: '78-26 / Coffee Table', created_by_name: 'Rajender Kumar' },
        { id: 88, project_name: '78-26 / Marco Back High Chair', created_by_name: 'Rajender Kumar' },
        { id: 89, project_name: '78-26 / La Festa Cocktail Trolley', created_by_name: 'Rajender Kumar' },
        { id: 90, project_name: '78-26 / Pouf', created_by_name: 'Rajender Kumar' },
        { id: 91, project_name: '78-26 / Marco wing Back Chair', created_by_name: 'Rajender Kumar' },
        { id: 92, project_name: '78-26 / Marco Fixed Sofa', created_by_name: 'Rajender Kumar' },
        { id: 93, project_name: '25-26 / Forma Side Table', created_by_name: 'Rajender Kumar' },
        { id: 94, project_name: '1-26 / Falcon Side Table', created_by_name: 'Rajender Kumar' },
        { id: 95, project_name: '4-26 / Pillar Side Table', created_by_name: 'Rajender Kumar' },
        { id: 96, project_name: '73-26 / Meghan Lounge Chair', created_by_name: 'Rajender Kumar' },
        { id: 97, project_name: '73-26 / MNZ Relax Chair', created_by_name: 'Rajender Kumar' },
        { id: 98, project_name: '147-26 / Celenite Door', created_by_name: 'Rajender Kumar' },
        { id: 99, project_name: '1108-26 / Stone', created_by_name: 'Rajender Kumar' },
        { id: 100, project_name: '163-26 / Mound Sofa(Brass)', created_by_name: 'Rajender Kumar' },
        { id: 101, project_name: '163-26 / Lounge Chair Brass(Brass)', created_by_name: 'Rajender Kumar' },
        { id: 102, project_name: '94-26 / Coffee Table Square', created_by_name: 'Rajender Kumar' },
        { id: 103, project_name: '94-26 / Coffee Table Round', created_by_name: 'Rajender Kumar' },
        { id: 104, project_name: '94-26 / Side Table', created_by_name: 'Rajender Kumar' },
        { id: 105, project_name: '94-26 / Side Table Low', created_by_name: 'Rajender Kumar' },
        { id: 106, project_name: '94-26 / 3 Seater Sofa', created_by_name: 'Rajender Kumar' },
        { id: 107, project_name: '94-26 / Swivel Lounge Chair Base', created_by_name: 'Rajender Kumar' },
        { id: 108, project_name: '94-26 / Swivel Lounge Chair Legs', created_by_name: 'Rajender Kumar' },
        { id: 109, project_name: '94-26 / Manual Hydraulic Bed', created_by_name: 'Rajender Kumar' },
        { id: 110, project_name: '94-26 / Night Table', created_by_name: 'Rajender Kumar' },
        { id: 111, project_name: '94-26 / Low Cabinet', created_by_name: 'Rajender Kumar' },
        { id: 112, project_name: '94-26 / Dining Table', created_by_name: 'Rajender Kumar' },
        { id: 113, project_name: '94-26 / Dining Chair', created_by_name: 'Rajender Kumar' },
        { id: 114, project_name: '94-26 / Relax Chair', created_by_name: 'Rajender Kumar' },
        { id: 115, project_name: '167-26 / Swivel Chair', created_by_name: 'Rajender Kumar' },
        { id: 116, project_name: '134-26 / Aurora Regis Bench', created_by_name: 'Nishant kumar' },
        { id: 117, project_name: '134-26 / Sectional Sofa', created_by_name: 'Nishant kumar' },
        { id: 118, project_name: '134-26 / Chaise Lounge 001', created_by_name: 'Nishant kumar' },
        { id: 119, project_name: '134-26 / Bowie Coffee Table Round', created_by_name: 'Nishant kumar' },
        { id: 120, project_name: '134-26 / Bowie Side Table', created_by_name: 'Nishant kumar' },
        { id: 121, project_name: '134-26 / Bowie Pouf', created_by_name: 'Nishant kumar' },
        { id: 122, project_name: '134-26 / Aurora Eclipse Side Table', created_by_name: 'Nishant kumar' },
        { id: 123, project_name: '134-26 / Harper Side Table A', created_by_name: 'Nishant kumar' },
        { id: 124, project_name: '134-26 / Harper Side Table B', created_by_name: 'Nishant kumar' },
        { id: 125, project_name: '134-26 / Aurora Vito Lounge Chair', created_by_name: 'Nishant kumar' },
        { id: 126, project_name: '134-26 / Harper Dining Table', created_by_name: 'Nishant kumar' },
        { id: 127, project_name: '134-26 / Bowie Study Arm Chair', created_by_name: 'Nishant kumar' },
        { id: 128, project_name: '134-26 / Harper Chaise Lounge', created_by_name: 'Nishant kumar' },
        { id: 129, project_name: '134-26 / Fifties Dining/ Study Chair', created_by_name: 'Nishant kumar' },
        { id: 130, project_name: '134-26 / Nelson Study Desk', created_by_name: 'Nishant kumar' },
        { id: 131, project_name: '134-26 / Twin Bed 001 A LHS', created_by_name: 'Nishant kumar' },
        { id: 132, project_name: '134-26 / Twin Bed 001 B RHS', created_by_name: 'Nishant kumar' },
        { id: 133, project_name: '134-26 / Fifties Night Table', created_by_name: 'Rajender Kumar' },
        { id: 134, project_name: '134-26 / MNZ Relax Chair', created_by_name: 'Rajender Kumar' },
        { id: 135, project_name: '134-26 / Nelson Swivel Chair', created_by_name: 'Rajender Kumar' },
        { id: 136, project_name: '134-26 / Harper Pouf', created_by_name: 'Rajender Kumar' }
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
            ? { ...item, quantity: parseFloat((item.quantity + 1).toFixed(2)) }
            : item
        )
      );
    } else {
      if (product.current_stock < 0.01) {
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
    if (newQuantity < 0.01) {
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

  // Outward rate includes the product's wastage uplift (GST is not charged on issues)
  const effectiveRate = (product) =>
    parseFloat(((product.cost_price * (1 + (parseFloat(product.wastage_percent) || 0) / 100))).toFixed(2));

  const calculateSubtotal = () => {
    return cart.reduce(
      (sum, item) => sum + effectiveRate(item.product) * item.quantity - item.discount,
      0
    );
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
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
                        {formatCurrency(effectiveRate(product))}
                      </p>
                      {parseFloat(product.wastage_percent) > 0 && (
                        <p className="text-xs text-orange-600">
                          incl. wastage +{formatCurrency(effectiveRate(product) - product.cost_price)}/unit
                        </p>
                      )}
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
                      {parseFloat(item.product.wastage_percent) > 0 && (
                        <p className="text-xs text-orange-600">
                          incl. wastage +{formatCurrency(effectiveRate(item.product) - item.product.cost_price)}/unit ({item.product.wastage_percent}%)
                        </p>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, Math.max(0.01, parseFloat((item.quantity - 0.25).toFixed(2))))}
                          className="p-1 rounded-lg hover:bg-gray-100"
                        >
                          <FiMinus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.product.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-12 text-center border rounded-lg py-1"
                          min="0.01"
                          step="0.01"
                        />
                        <button
                          onClick={() => updateQuantity(item.product.id, parseFloat((item.quantity + 1).toFixed(2)))}
                          className="p-1 rounded-lg hover:bg-gray-100"
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-900">
                      {formatCurrency(effectiveRate(item.product))}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {formatCurrency(effectiveRate(item.product) * item.quantity - item.discount)}
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
                Cart cannot mix Consumable and Non-Consumable items together, To Ensure Accurate Billing.
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
