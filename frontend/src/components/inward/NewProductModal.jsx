import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { UNIT_OPTIONS } from './inwardUtils';
import CategorySelect from './CategorySelect';

/** Collects details for a product that does not exist yet; it is created when the inward is submitted. */
const NewProductModal = ({ initialName, categories, onClose, onSave }) => {
  const [form, setForm] = useState({ name: initialName || '', category: '', unit: 'pcs', gst_rate: '18' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      name: form.name.trim().replace(/\s+/g, ' '),
      category: Number(form.category),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">New Product</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Only add a new product if it is not in the suggestions. It will be created when this inward is submitted.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              required
              maxLength={200}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <CategorySelect
              categories={categories}
              value={form.category}
              onChange={(category) => setForm({ ...form, category })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST % *</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                step="0.01"
                value={form.gst_rate}
                onChange={(e) => setForm({ ...form, gst_rate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
            Use Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewProductModal;
