import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiTrash2, FiTruck, FiX } from 'react-icons/fi';
import { inventoryAPI, purchaseAPI } from '../services/api';
import SearchSelect from '../components/SearchSelect';
import ConfirmModal from '../components/ConfirmModal';
import VendorFormModal from '../components/inward/VendorFormModal';
import NewProductModal from '../components/inward/NewProductModal';
import CategorySelect from '../components/inward/CategorySelect';
import { calculateTotals, firstErrorMessage, formatCurrency, lineAmount } from '../components/inward/inwardUtils';

let rowKey = 0;
const emptyRow = () => ({
  key: ++rowKey, query: '', product: null, newProduct: null, category_id: '', quantity: '', unit_price: '', tax_rate: '',
});

// Existing product without a category: the user must pick one (it is saved to the product)
const needsCategory = (row) => Boolean(row.product && !row.product.category);

const inputClass = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent';

const NewInward = ({ onClose, onCreated }) => {
  const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const [supplier, setSupplier] = useState(null);
  const [supplierQuery, setSupplierQuery] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [poNumber, setPoNumber] = useState('');
  const [rows, setRows] = useState([emptyRow()]);
  const [roundOff, setRoundOff] = useState('');
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    inventoryAPI
      .getCategories()
      .then((response) => setCategories((response.data.results || response.data).filter((c) => c.is_active)))
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  const [duplicateCheck, setDuplicateCheck] = useState(null);
  const [vendorModalName, setVendorModalName] = useState(null);
  const [newProductRow, setNewProductRow] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const duplicateCheckId = useRef(0);
  const submittingRef = useRef(false);

  // Live duplicate check for the vendor's invoice number (backend re-validates on submit)
  const trimmedNumber = invoiceNumber.trim();
  useEffect(() => {
    const id = ++duplicateCheckId.current;
    if (!supplier || !trimmedNumber) return undefined;
    const timer = setTimeout(async () => {
      try {
        const response = await purchaseAPI.checkInvoice(supplier.id, trimmedNumber);
        if (id === duplicateCheckId.current) {
          setDuplicateCheck({ supplierId: supplier.id, number: trimmedNumber, ...response.data });
        }
      } catch {
        // Ignore: the submit request performs the authoritative check
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [supplier, trimmedNumber]);

  const duplicate =
    duplicateCheck?.exists && duplicateCheck.supplierId === supplier?.id && duplicateCheck.number === trimmedNumber
      ? duplicateCheck
      : null;

  const totals = calculateTotals(rows, roundOff);

  const searchSuppliers = async (query) => {
    const response = await inventoryAPI.getSuppliers({ search: query, is_active: true });
    return response.data.results || response.data;
  };

  const searchProducts = async (query) => {
    const response = await inventoryAPI.getProducts({ search: query });
    return response.data.results || response.data;
  };

  const updateRow = (key, changes) => setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)));

  // A trailing empty row always exists; picking a product in it spawns the next one
  const appendRowIfLast = (key) =>
    setRows((current) => (current[current.length - 1]?.key === key ? [...current, emptyRow()] : current));

  // A row with nothing entered is ignored on submit (the trailing empty row is the common case)
  const isRowEmpty = (row) =>
    !row.product && !row.newProduct && !row.query.trim() && row.quantity === '' && row.unit_price === '';

  const filledRows = rows.filter((row) => !isRowEmpty(row));

  const selectProduct = (key, product) => {
    updateRow(key, {
      product,
      newProduct: null,
      category_id: '',
      query: product.name,
      unit_price: String(product.cost_price),
      tax_rate: String(product.gst_rate),
    });
    appendRowIfLast(key);
  };

  const saveNewProduct = (data) => {
    updateRow(newProductRow.key, { product: null, newProduct: data, query: data.name, tax_rate: data.gst_rate });
    appendRowIfLast(newProductRow.key);
    setNewProductRow(null);
  };

  const removeRow = (key) => setRows((current) => (current.length === 1 ? [emptyRow()] : current.filter((row) => row.key !== key)));

  const isPriceChange = (row) =>
    row.product && row.unit_price !== '' && parseFloat(row.unit_price) !== parseFloat(row.product.cost_price);

  const validate = () => {
    if (!supplier) return 'Select a vendor';
    if (!invoiceNumber.trim()) return 'Enter the invoice number';
    if (duplicate) return `This invoice is already recorded as ${duplicate.inward_number}`;
    if (!invoiceDate) return 'Enter the invoice date';
    if (invoiceDate > today) return 'Invoice date cannot be in the future';
    if (filledRows.length === 0) return 'Item 1: select a product from the suggestions';
    for (let i = 0; i < filledRows.length; i += 1) {
      const row = filledRows[i];
      if (!row.product && !row.newProduct) return `Item ${i + 1}: select a product from the suggestions`;
      if (needsCategory(row) && !row.category_id) return `Item ${i + 1}: select a category`;
      if (row.newProduct && !row.newProduct.category) return `Item ${i + 1}: select a category`;
      if (!(parseFloat(row.quantity) > 0)) return `Item ${i + 1}: enter a quantity`;
      if (!(parseFloat(row.unit_price) > 0)) return `Item ${i + 1}: enter the rate`;
      if (row.tax_rate === '' || parseFloat(row.tax_rate) < 0 || parseFloat(row.tax_rate) > 100) return `Item ${i + 1}: enter a valid GST %`;
    }
    const round = parseFloat(roundOff) || 0;
    if (Math.abs(round) > 10) return 'Round off must be between -10 and 10';
    return null;
  };

  const handleReview = () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const payload = {
        supplier_id: supplier.id,
        supplier_invoice_number: invoiceNumber.trim(),
        supplier_invoice_date: invoiceDate,
        po_number: poNumber.trim(),
        round_off: (parseFloat(roundOff) || 0).toFixed(2),
        notes: notes.trim(),
        items: filledRows.map((row) => ({
          ...(row.product ? { product_id: row.product.id } : { new_product: row.newProduct }),
          ...(needsCategory(row) ? { category_id: Number(row.category_id) } : {}),
          quantity: row.quantity,
          unit_price: row.unit_price,
          tax_rate: row.tax_rate,
        })),
      };
      const response = await purchaseAPI.createInward(payload);
      toast.success(`Inward ${response.data.inward_number} recorded`);
      onCreated(response.data.id);
    } catch (error) {
      setShowConfirm(false);
      const status = error.response?.status;
      if (!error.response) toast.error('Network error. Please check your connection.');
      else if (status >= 500) toast.error('Server error. The inward was not saved. Please try again or contact support.');
      else if (status === 403) toast.error('You do not have permission to record inwards.');
      else toast.error(firstErrorMessage(error.response.data));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-50 rounded-xl shadow-xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">New Inward</h1>
            <p className="text-sm text-gray-500">Record goods received against a vendor invoice</p>
          </div>
          <button onClick={() => !submitting && onClose()} className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg" title="Close">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Invoice details */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Invoice Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="xl:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Vendor Name *</label>
                <SearchSelect
                  value={supplierQuery}
                  onChange={(text) => {
                    setSupplierQuery(text);
                    if (supplier) setSupplier(null);
                  }}
                  fetchOptions={searchSuppliers}
                  onSelect={(vendor) => {
                    setSupplier(vendor);
                    setSupplierQuery(vendor.name);
                  }}
                  renderOption={(vendor) => (
                    <div>
                      <p className="font-medium text-gray-900">{vendor.name}</p>
                      <p className="text-xs text-gray-500">
                        {vendor.gst_number ? `GSTIN: ${vendor.gst_number}` : 'No GSTIN'}{vendor.city ? ` · ${vendor.city}` : ''}
                      </p>
                    </div>
                  )}
                  onCreate={(name) => setVendorModalName(name)}
                  createLabel={(name) => `Add new vendor "${name}"`}
                  placeholder="Search vendor by name or GSTIN..."
                  invalid={supplierQuery.trim() !== '' && !supplier}
                  autoFocus
                />
                {supplierQuery.trim() !== '' && !supplier && (
                  <p className="mt-1 text-xs text-orange-600">Select a vendor from the suggestions</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">GSTIN/UIN</label>
                <input type="text" readOnly value={supplier?.gst_number || ''} placeholder="Auto-filled from vendor" className={`${inputClass} bg-gray-50`} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Vendor Address</label>
                <input
                  type="text"
                  readOnly
                  value={supplier ? [supplier.address, supplier.city, supplier.state].filter(Boolean).join(', ') : ''}
                  placeholder="Auto-filled from vendor"
                  title={supplier?.address || ''}
                  className={`${inputClass} bg-gray-50`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Invoice No *</label>
                <input
                  type="text"
                  maxLength={100}
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. AM/25-27/317"
                  className={`${inputClass} ${duplicate ? 'border-red-400' : ''}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Invoice Date *</label>
                <input type="date" max={today} value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">PO No</label>
                <input type="text" maxLength={100} value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Optional" className={inputClass} />
              </div>
            </div>
            {duplicate && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg">
                <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
                This invoice from {supplier?.name} is already recorded as <strong>{duplicate.inward_number}</strong>.
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[66rem]">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b">
                    <th className="pb-2 w-10">#</th>
                    <th className="pb-2">Item Name</th>
                    <th className="pb-2 w-44">Category</th>
                    <th className="pb-2 w-28">Qty</th>
                    <th className="pb-2 w-16">Unit</th>
                    <th className="pb-2 w-32">Rate</th>
                    <th className="pb-2 w-24">GST %</th>
                    <th className="pb-2 w-32 text-right">Amount</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const unit = row.product?.unit || row.newProduct?.unit || '';
                    return (
                      <tr key={row.key} className="border-b last:border-b-0 align-top">
                        <td className="py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="py-3 pr-3">
                          <SearchSelect
                            value={row.query}
                            onChange={(text) => updateRow(row.key, { query: text, product: null, newProduct: null })}
                            fetchOptions={searchProducts}
                            onSelect={(product) => selectProduct(row.key, product)}
                            renderOption={(product) => (
                              <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {product.sku} · {product.unit}
                                    {` · ${product.category_name || 'No category'}`}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(product.cost_price)}</p>
                                  <p className="text-xs text-gray-500">Stock: {product.current_stock}</p>
                                </div>
                              </div>
                            )}
                            onCreate={(name) => setNewProductRow({ key: row.key, name })}
                            createLabel={(name) => `Add new product "${name}"`}
                            placeholder="Search product..."
                            invalid={row.query.trim() !== '' && !row.product && !row.newProduct}
                            autoFocus={index > 0 && row.query === ''}
                          />
                          {row.newProduct && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                              New product
                            </span>
                          )}
                          {isPriceChange(row) && (
                            <p className="mt-1 text-xs text-orange-600">
                              Rate differs from {formatCurrency(row.product.cost_price)} — stock will be added to a separate
                              “(price change)” item. The original stays unchanged.
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          {row.product?.category ? (
                            <p className="text-sm text-gray-700 pt-2">{row.product.category_name}</p>
                          ) : needsCategory(row) ? (
                            <CategorySelect
                              categories={categories}
                              value={row.category_id}
                              onChange={(category_id) => updateRow(row.key, { category_id })}
                              invalid={!row.category_id}
                            />
                          ) : row.newProduct ? (
                            <CategorySelect
                              categories={categories}
                              value={row.newProduct.category}
                              onChange={(category) => updateRow(row.key, { newProduct: { ...row.newProduct, category: Number(category) || '' } })}
                              invalid={!row.newProduct.category}
                            />
                          ) : (
                            <p className="text-sm text-gray-400 pt-2">-</p>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={row.quantity}
                            onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                            className={inputClass}
                          />
                        </td>
                        <td className="py-3 pr-3 text-sm text-gray-600 pt-5">{unit || '-'}</td>
                        <td className="py-3 pr-3">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={row.unit_price}
                            onChange={(e) => updateRow(row.key, { unit_price: e.target.value })}
                            className={`${inputClass} ${isPriceChange(row) ? 'border-orange-400' : ''}`}
                          />
                        </td>
                        <td className="py-3 pr-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={row.tax_rate}
                            onChange={(e) => updateRow(row.key, { tax_rate: e.target.value })}
                            className={inputClass}
                          />
                        </td>
                        <td className="py-3 text-right text-sm font-medium text-gray-900 pt-5">
                          {formatCurrency(lineAmount(row.quantity, row.unit_price))}
                        </td>
                        <td className="py-3 text-right">
                          <button onClick={() => removeRow(row.key)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Remove item">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400">Fill a row to add the next item automatically</p>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label>
              <textarea
                rows={4}
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional (transport, remarks...)"
                className={inputClass}
              />
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal ({rows.length} item{rows.length > 1 ? 's' : ''})</span>
                <span className="text-gray-900">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GST</span>
                <span className="text-gray-900">{formatCurrency(totals.tax)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Round Off</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRoundOff((Math.round(totals.subtotal + totals.tax) - totals.subtotal - totals.tax).toFixed(2))}
                    title="Auto round off to a whole rupee total"
                    className="text-3xl"
                  >
                    ≅
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    min="-10"
                    max="10"
                    value={roundOff}
                    onChange={(e) => setRoundOff(e.target.value)}
                    placeholder="0.00"
                    className="w-28 px-3 py-1.5 text-sm text-right border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex justify-between pt-3 border-t text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
              <p className="text-xs text-gray-500">Check this total matches the vendor invoice before submitting.</p>
              <button
                onClick={handleReview}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                <FiTruck className="w-4 h-4" />
                Submit Inward
              </button>
            </div>
          </div>
        </div>
      </div>

      {vendorModalName !== null && (
        <VendorFormModal
          initialName={vendorModalName}
          onClose={() => setVendorModalName(null)}
          onCreated={(vendor) => {
            setSupplier(vendor);
            setSupplierQuery(vendor.name);
            setVendorModalName(null);
          }}
        />
      )}

      {newProductRow && (
        <NewProductModal
          initialName={newProductRow.name}
          categories={categories}
          onClose={() => setNewProductRow(null)}
          onSave={saveNewProduct}
        />
      )}

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => !submitting && setShowConfirm(false)}
        onConfirm={handleSubmit}
        title="Submit inward?"
        message={`${filledRows.length} item(s) from ${supplier?.name || ''}, total ${formatCurrency(totals.total)}. Stock will be added now. Once submitted, this inward cannot be edited or reverted.`}
        confirmText={submitting ? 'Submitting...' : 'Submit'}
        type="info"
      />
    </div>
  );
};

export default NewInward;
