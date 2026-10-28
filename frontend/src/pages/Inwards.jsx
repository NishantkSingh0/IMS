import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiCalendar, FiDownload, FiEye, FiPlus, FiRefreshCw, FiSearch, FiTruck } from 'react-icons/fi';
import { purchaseAPI } from '../services/api';
import InwardDetailModal from '../components/inward/InwardDetailModal';
import { formatCurrency } from '../components/inward/inwardUtils';
import NewInward from './NewInward';

const PAGE_SIZE = 20;

const Inwards = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [inwards, setInwards] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  // Navigation can pre-fill the search box (e.g. from a product's stock history)
  const [searchQuery, setSearchQuery] = useState(() => location.state?.search || '');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [selectedInward, setSelectedInward] = useState(null);
  // Deep links to /inwards/new redirect here with openNewInward set
  const [showNewInward, setShowNewInward] = useState(() => Boolean(location.state?.openNewInward));
  const [refreshKey, setRefreshKey] = useState(0);

  const filterParams = useMemo(() => {
    const params = {};
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (fromDate) params.invoice_date_gte = fromDate;
    if (toDate) params.invoice_date_lte = toDate;
    return params;
  }, [searchQuery, fromDate, toDate]);

  // Changing a filter always goes back to the first page
  const updateFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const changeSearch = updateFilter(setSearchQuery);
  const changeFromDate = updateFilter(setFromDate);
  const changeToDate = updateFilter(setToDate);

  useEffect(() => {
    purchaseAPI.getStats().then((response) => setStats(response.data)).catch(() => {});
  }, [refreshKey]);

  useEffect(() => {
    if (location.state?.openNewInward || location.state?.search) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const handleInwardCreated = (id) => {
    setShowNewInward(false);
    setRefreshKey((key) => key + 1);
    viewInward(id);
  };

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await purchaseAPI.getInwards({ ...filterParams, page });
        if (cancelled) return;
        setInwards(response.data.results || response.data);
        setCount(response.data.count ?? (response.data.length || 0));
      } catch (error) {
        console.error('Error fetching inwards:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filterParams, page, refreshKey]);

  async function viewInward(id) {
    try {
      const response = await purchaseAPI.getInward(id);
      setSelectedInward(response.data);
    } catch (error) {
      console.error('Error fetching inward:', error);
    }
  }

  const handleExport = async () => {
    try {
      const blob = await purchaseAPI.exportInwardsExcel(filterParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inwards_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error exporting inwards:', error);
      toast.error('Failed to export inwards');
    }
  };

  const hasFilters = searchQuery || fromDate || toDate;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const inputClass = 'w-full h-11 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition';

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inwards</h1>
          <p className="text-gray-500">Goods received from vendors</p>
        </div>

        <div className="flex items-center gap-3 sm:ml-auto">
          {inwards.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              <FiDownload className="w-4 h-4" />
              Export Filter
            </button>
          )}

          <button
            onClick={() => setShowNewInward(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            <FiPlus className="w-4 h-4" />
            New Inward
          </button>
        </div>
      </div>


      {/* Stats */}

{stats && (
  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
    {/* Overall Statistics */}
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Overall Overview
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Inwards</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {stats.total_inwards}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {formatCurrency(stats.total_value)}
          </p>
        </div>
      </div>
    </div>

    {/* Monthly Statistics */}
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Monthly Overview
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Inwards This Month</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {stats.month_inwards}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">This Month Value</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {formatCurrency(stats.month_value)}
          </p>
        </div>
      </div>
    </div>
  </div>
)}


      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-[1.4]">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => changeSearch(e.target.value)}
                placeholder="Vendor, invoice no, PO no, GSTIN, product or inward no..."
                className={`${inputClass} pl-10 pr-4`}
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Invoice Date Range</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input type="date" value={fromDate} onChange={(e) => changeFromDate(e.target.value)} className={`${inputClass} pl-9 pr-2`} />
              </div>
              <span className="text-gray-400 text-xs font-medium">to</span>
              <div className="relative flex-1">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input type="date" value={toDate} onChange={(e) => changeToDate(e.target.value)} className={`${inputClass} pl-9 pr-2`} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {hasFilters ? (
            <button
              onClick={() => { setSearchQuery(''); setFromDate(''); setToDate(''); setPage(1); }}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1.5"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          ) : <span />}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : inwards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FiTruck className="w-16 h-16 mb-4" />
            <p className="text-lg">No inwards found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Inward No', 'Vendor', 'Invoice No', 'Invoice Date', 'PO No', 'Items', 'Total', ''].map((heading, i) => (
                    <th key={i} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${i >= 5 ? 'text-right' : 'text-left'}`}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inwards.map((inward) => (
                  <tr key={inward.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewInward(inward.id)}>
                    <td className="px-6 py-4 font-medium text-primary-600">{inward.inward_number}</td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{inward.supplier_name}</p>
                      {inward.supplier_gstin && <p className="text-xs text-gray-500">{inward.supplier_gstin}</p>}
                    </td>
                    <td className="px-6 py-4 text-gray-900">{inward.supplier_invoice_number}</td>
                    <td className="px-6 py-4 text-gray-500">{format(new Date(`${inward.supplier_invoice_date}T00:00:00`), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 text-gray-500">{inward.po_number || '-'}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{inward.item_count}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(inward.total_amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <FiEye className="w-4 h-4 text-gray-500 inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, count)} of {count} inwards
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-gray-100 rounded-lg">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showNewInward && <NewInward onClose={() => setShowNewInward(false)} onCreated={handleInwardCreated} />}
      {selectedInward && <InwardDetailModal inward={selectedInward} onClose={() => setSelectedInward(null)} />}
    </div>
  );
};

export default Inwards;
