import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { inventoryAPI } from '../../services/api';
import { firstErrorMessage } from './inwardUtils';

const FIELDS = [
  { name: 'name', label: 'Vendor Name', required: true, span: 2 },
  { name: 'gst_number', label: 'GSTIN/UIN', maxLength: 20 },
  { name: 'phone', label: 'Phone', required: true, maxLength: 15 },
  { name: 'address', label: 'Address', required: true, span: 2 },
  { name: 'city', label: 'City', required: true },
  { name: 'state', label: 'State', required: true },
  { name: 'pincode', label: 'Pincode', required: true, maxLength: 10 },
];

const VendorFormModal = ({ initialName, onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: initialName || '', gst_number: '', phone: '', address: '', city: '', state: '', pincode: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, gst_number: form.gst_number.trim().toUpperCase() };
      const response = await inventoryAPI.createSupplier(payload);
      toast.success(`Vendor "${response.data.name}" added`);
      onCreated(response.data);
    } catch (error) {
      if (error.response?.status === 400) toast.error(firstErrorMessage(error.response.data));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add New Vendor</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {FIELDS.map((field) => (
            <div key={field.name} className={field.span === 2 ? 'col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}{field.required && ' *'}
              </label>
              <input
                type="text"
                required={field.required}
                maxLength={field.maxLength}
                value={form[field.name]}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Vendor'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorFormModal;
