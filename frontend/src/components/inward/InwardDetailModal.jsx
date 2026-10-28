import { format } from 'date-fns';
import { FiPrinter, FiX } from 'react-icons/fi';
import { formatCurrency } from './inwardUtils';

const Field = ({ label, value, align = 'left' }) => (
  <div className={align === 'right' ? 'text-right' : ''}>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium text-gray-900 break-words">{value || '-'}</p>
  </div>
);

const InwardDetailModal = ({ inward, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold">Inward {inward.inward_number}</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <FiX className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 mb-6">
          <Field label="Vendor" value={inward.supplier_name} />
          <Field label="GSTIN/UIN" value={inward.supplier_gstin} />
          <Field label="Invoice No" value={inward.supplier_invoice_number} />
          <Field label="Invoice Date" value={format(new Date(`${inward.supplier_invoice_date}T00:00:00`), 'dd MMM yyyy')} />
          <Field label="PO No" value={inward.po_number} />
          <Field label="Recorded" value={`${format(new Date(inward.created_at), 'dd MMM yyyy, hh:mm a')}${inward.created_by_name ? ` by ${inward.created_by_name}` : ''}`} />
          {inward.notes && (
            <div className="col-span-2 md:col-span-3">
              <Field label="Notes" value={inward.notes} />
            </div>
          )}
        </div>

        <div className="border rounded-lg overflow-x-auto mb-6">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Item', 'Qty', 'Rate', 'GST', 'Amount'].map((heading, i) => (
                  <th key={heading} className={`px-4 py-2 text-xs font-medium text-gray-500 uppercase ${i === 0 ? 'text-left' : 'text-right'}`}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {inward.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-xs text-gray-500">
                      {item.product_sku}{item.category_name ? ` · ${item.category_name}` : ''}
                    </p>
                    {item.is_price_change && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
                        Price change
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{item.quantity} {item.unit}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {formatCurrency(item.tax_amount)}
                    <span className="block text-xs text-gray-400">{parseFloat(item.tax_rate)}%</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-900">{formatCurrency(inward.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">GST</span>
            <span className="text-gray-900">{formatCurrency(inward.tax_amount)}</span>
          </div>
          {parseFloat(inward.freight_charges) !== 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Freight / Additional Charges</span>
              <span className="text-gray-900">{formatCurrency(inward.freight_charges)}</span>
            </div>
          )}
          {parseFloat(inward.round_off) !== 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Round Off</span>
              <span className="text-gray-900">{formatCurrency(inward.round_off)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(inward.total_amount)}</span>
          </div>
        </div>
      </div>
      <div className="p-4 border-t flex justify-end space-x-3">
        <button
          onClick={() => window.print()}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          <FiPrinter className="w-4 h-4" />
          <span>Print</span>
        </button>
        <button onClick={onClose} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
          Close
        </button>
      </div>
    </div>
  </div>
);

export default InwardDetailModal;
