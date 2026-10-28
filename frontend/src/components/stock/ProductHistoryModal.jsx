import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { FiArrowDown, FiArrowUp, FiClock, FiExternalLink, FiX } from 'react-icons/fi';
import { inventoryAPI } from '../../services/api';

const HISTORY_DAYS = 60;
const PAGE_SIZE = 20;

const formatQty = (value) => parseFloat(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const SummaryCard = ({ label, value, unit, tone = 'text-gray-900', icon: Icon }) => (
  <div className="bg-gray-50 rounded-lg p-3">
    <p className="text-xs text-gray-500 flex items-center gap-1">
      {Icon && <Icon className={`w-3.5 h-3.5 ${tone}`} />}
      {label}
    </p>
    <p className={`text-lg font-bold mt-0.5 ${tone}`}>
      {formatQty(value)} <span className="text-xs font-medium text-gray-500">{unit}</span>
    </p>
  </div>
);

const MovementDetails = ({ row, onOpen }) => {
  const inward = row.movement === 'inward';
  return (
    <button
      onClick={() => onOpen(row)}
      className="text-left group"
      title={inward ? 'Open inward for this invoice' : 'Open outward slip'}
    >
      {inward ? (
        <>
          <p className="text-gray-900 group-hover:underline decoration-dotted underline-offset-4">
            Inv <span className="font-medium">{row.vendor_invoice_number || '-'}</span>
            {row.vendor_name && <> · {row.vendor_name}</>}
            <FiExternalLink className="inline w-3 h-3 ml-1.5 mb-0.5 text-gray-400" />
          </p>
          <p className="text-xs text-gray-500">
            {row.inward_number || '-'}{row.po_number ? ` · PO ${row.po_number}` : ''}
          </p>
        </>
      ) : (
        <>
          <p className="text-gray-900 group-hover:underline decoration-dotted underline-offset-4">
            Slip <span className="font-medium">{row.slip_number || '-'}</span>
            {row.department_name && <> · {row.department_name}</>}
            <FiExternalLink className="inline w-3 h-3 ml-1.5 mb-0.5 text-gray-400" />
          </p>
          <p className="text-xs text-gray-500">{row.project_name || '-'}</p>
        </>
      )}
    </button>
  );
};

/** Inward / outward movements of a product over the last 60 days. */
const ProductHistoryModal = ({ product, onClose }) => {
  const navigate = useNavigate();
  const [minDate] = useState(() => format(subDays(new Date(), HISTORY_DAYS), 'yyyy-MM-dd'));
  const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [movement, setMovement] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const params = { page };
    if (movement) params.movement = movement;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    inventoryAPI
      .getProductHistory(product.id, params)
      .then((response) => {
        if (cancelled) return;
        setData(response.data);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product.id, movement, dateFrom, dateTo, page]);

  // Changing a filter always goes back to the first page
  const updateFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
    setLoading(true);
  };
  const changePage = (next) => {
    setPage(next);
    setLoading(true);
  };

  const openDocument = (row) =>
    navigate(row.movement === 'inward' ? '/inwards' : '/invoices', {
      state: { search: row.movement === 'inward' ? row.vendor_invoice_number : row.slip_number },
    });

  const unit = data?.product.unit || product.unit;
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));
  const hasFilters = movement || dateFrom || dateTo;
  const inputClass = 'px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FiClock className="w-5 h-5 text-gray-500" />
              Stock History · {product.name}
            </h3>
            <p className="text-sm text-gray-500">
              {product.sku}{product.category_name ? ` · ${product.category_name}` : ''} · last {HISTORY_DAYS} days
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard label="Current Stock" value={data.summary.current_stock} unit={unit} />
              <SummaryCard label={hasFilters ? 'Opening (period)' : 'Opening (2 months ago)'} value={data.summary.opening_stock} unit={unit} />
              <SummaryCard label="Total In" value={data.summary.total_in} unit={unit} tone="text-green-600" icon={FiArrowUp} />
              <SummaryCard label="Total Out" value={data.summary.total_out} unit={unit} tone="text-red-600" icon={FiArrowDown} />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <select value={movement} onChange={updateFilter(setMovement)} className={inputClass}>
              <option value="">All movements</option>
              <option value="inward">Inward</option>
              <option value="outward">Outward</option>
            </select>
            <input type="date" min={minDate} max={dateTo || today} value={dateFrom} onChange={updateFilter(setDateFrom)} className={inputClass} />
            <span className="text-gray-400 text-xs font-medium">to</span>
            <input type="date" min={dateFrom || minDate} max={today} value={dateTo} onChange={updateFilter(setDateTo)} className={inputClass} />
            {hasFilters && (
              <button
                onClick={() => { setMovement(''); setDateFrom(''); setDateTo(''); changePage(1); }}
                className="text-xs font-medium text-gray-500 hover:text-gray-900"
              >
                Reset
              </button>
            )}
          </div>

          <div className="border rounded-lg overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <p className="p-8 text-center text-sm text-red-600">Failed to load stock history</p>
            ) : data.results.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-500">No movements in the last 2 months</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Date & Time', 'Movement', 'Change', 'Details', 'Stock'].map((heading, i) => (
                      <th key={heading} className={`px-4 py-2 text-xs font-medium text-gray-500 uppercase ${i === 2 || i === 4 ? 'text-right' : 'text-left'}`}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.results.map((row) => {
                    const inward = row.movement === 'inward';
                    return (
                      <tr key={row.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-gray-900">{format(new Date(row.created_at), 'dd MMM yyyy')}</p>
                          <p className="text-xs text-gray-500">{format(new Date(row.created_at), 'hh:mm a')}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${inward ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {inward ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />}
                            {inward ? 'Inward' : 'Outward'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${inward ? 'text-green-600' : 'text-red-600'}`}>
                          {inward ? '+' : '−'}{formatQty(Math.abs(parseFloat(row.change)))} {unit}
                        </td>
                        <td className="px-4 py-3"><MovementDetails row={row} onOpen={openDocument} /></td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-gray-400">{formatQty(row.stock_before)} → </span>
                          <span className="font-medium text-gray-900">{formatQty(row.stock_after)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {data && totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{data.count} movements</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changePage(page - 1)}
                  disabled={page <= 1 || loading}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-gray-100 rounded-lg">Page {page} of {totalPages}</span>
                <button
                  onClick={() => changePage(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductHistoryModal;
