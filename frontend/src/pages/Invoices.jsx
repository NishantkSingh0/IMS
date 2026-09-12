import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { salesAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  FiSearch,
  FiEye,
  FiPrinter,
  FiX,
  FiFileText,
  FiFilter,
  FiCalendar,
  FiRefreshCw,
  FiDownload,
} from 'react-icons/fi';

const Invoices = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1,
  });
  const isInitialMount = useRef(true);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    const projectParam = searchParams.get('project');
    const departmentParam = searchParams.get('department');

    setProjectFilter(projectParam || '');
    setSearchQuery(departmentParam || '');
  }, [location.search]);


  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
    }));
  }, [searchQuery, projectFilter, fromDate, toDate]);


  useEffect(() => {
    fetchInvoices();
  }, [
    searchQuery,
    projectFilter,
    fromDate,
    toDate,
    pagination.currentPage
  ]);

  const fetchInvoices = async () => {
    try {
      const params = {
        page: pagination.currentPage,
        page_size: 20
      };
      if (searchQuery) params.search = searchQuery;
      if (projectFilter) params.project_name = projectFilter;
      if (fromDate) params.created_at_gte = fromDate;
      if (toDate) params.created_at_lte = toDate;
      
      const response = await salesAPI.getInvoices(params);
      const data = response.data;
      
      if (data.results) {
        setInvoices(data.results);
        setPagination(prev => ({
          ...prev,
          count: data.count,
          next: data.next,
          previous: data.previous,
          totalPages: Math.ceil(data.count / 20),
        }));
      } else {
        setInvoices(data);
        setPagination(prev => ({
          ...prev,
          count: data.length,
          next: null,
          previous: null,
          totalPages: 1,
        }));
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewInvoice = async (id) => {
    try {
      const response = await salesAPI.getInvoice(id);
      setSelectedInvoice(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setProjectFilter('');
    setFromDate('');
    setToDate('');
  };

  const handleExportExcel = async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (projectFilter) params.project_name = projectFilter;
      if (fromDate) params.created_at_gte = fromDate;
      if (toDate) params.created_at_lte = toDate;

      const blob = await salesAPI.exportInvoicesExcel(params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `outward_slips_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error exporting invoices:', error);
      toast.error('Failed to export invoices');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Outward Slips</h1>
        <p className="text-gray-500">View all department Outwards</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">

          {(searchQuery || projectFilter || fromDate || toDate) && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          {/* Download Button - Only visible when filters are applied and user is owner */}
          {((searchQuery || projectFilter || fromDate || toDate) && invoices.length>0 && user?.role === 'owner') && (
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
              title="Export to Excel"
            >
              <FiDownload className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          )}
        </div>


        {/* Search Area */}
        <div className="flex flex-col xl:flex-row gap-4">

          {/* Invoice Number — Larger / Primary */}
          <div className="flex-[1.4]">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Department Name / Invoice Number 
            </label>

            <div className="relative">
              <FiSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search department name or invoice number..."
                className="w-full h-11 pl-10 pr-4 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
              />
            </div>
          </div>


          {/* Project — Medium */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Project Name
            </label>

            <div className="relative">
              <FiFilter
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              />

              <input
                type="text"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                placeholder="Search project..."
                className="w-full h-11 pl-10 pr-4 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
              />
            </div>
          </div>


          {/* Date Range — Grouped */}
          <div className="flex-[1.25]">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Date Range
            </label>

            <div className="flex items-center gap-2">

              {/* From */}
              <div className="relative flex-1">
                <FiCalendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                />

                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full h-11 pl-9 pr-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
                />
              </div>

              <span className="text-gray-400 text-xs font-medium">
                to
              </span>

              {/* To */}
              <div className="relative flex-1">
                <FiCalendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                />

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full h-11 pl-9 pr-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
                />
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FiFileText className="w-16 h-16 mb-4" />
            <p className="text-lg">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Slip ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-primary-600">{invoice.invoice_number}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {invoice.department_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {invoice.project_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {invoice.created_at ? format(new Date(invoice.created_at), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => viewInvoice(invoice.id)}
                        className="p-2 text-gray-500 hover:text-black hover:bg-gray-50 rounded-lg"
                        title="View Details"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {Math.max(0, ((pagination.currentPage - 1) * 20) + 1)} to {Math.min(pagination.currentPage * 20, pagination.count)} of {pagination.count} invoices
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                disabled={!pagination.previous || pagination.currentPage <= 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-gray-100 rounded-lg">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
                disabled={!pagination.next || pagination.currentPage >= pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Invoice {selectedInvoice.invoice_number}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium text-gray-900">
                    {selectedInvoice.department_name || '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(selectedInvoice.created_at), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department Code</p>
                  <p className="font-medium text-gray-900">
                    {selectedInvoice.department_code || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Project</p>
                  <p className="font-medium text-gray-900">
                    {selectedInvoice.project_name || '-'}
                  </p>
                </div>
                {selectedInvoice.project_created_by && (
                  <div>
                    <p className="text-sm text-gray-500">Project Created By</p>
                    <p className="font-medium text-gray-900">
                      {selectedInvoice.project_created_by}
                    </p>
                  </div>
                )}
              </div>

              {/* Invoice Items */}
              <div className="border rounded-lg overflow-hidden mb-6">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Item
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Qty
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedInvoice.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-sm text-gray-500">{item.product_sku}</p>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-green-600">
                      -{formatCurrency(selectedInvoice.discount_amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax (GST)</span>
                  <span className="text-gray-900">{formatCurrency(selectedInvoice.tax_amount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">
                    {formatCurrency(selectedInvoice.total_amount)}
                  </span>
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
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
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

export default Invoices;
