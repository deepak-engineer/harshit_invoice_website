import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Download, Edit, Trash2, Calendar, MapPin, Building, AlertCircle, FileSpreadsheet, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Dashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await api.delete(`/invoices/${id}`);
        fetchInvoices();
        toast.success('Invoice deleted successfully');
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete invoice');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/invoices/${id}/status`, { status: newStatus });
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
      toast.success('Status updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const handleDownload = (id, format) => {
    window.location.href = `${import.meta.env.VITE_API_URL || '/invoice_backend/api'}/invoices/${id}/${format}`;
  };

  const filteredInvoices = invoices.filter(inv => {
    const term = search.toLowerCase();
    const matchesSearch = (
      (inv.invoice_no && inv.invoice_no.toLowerCase().includes(term)) ||
      (inv.client_name && inv.client_name.toLowerCase().includes(term)) ||
      (inv.site_id && inv.site_id.toLowerCase().includes(term))
    );
    
    // Normalize status from backend to match our filters
    // Drafts will be considered 'PENDING' in the filter if they exist
    const invStatus = inv.status ? inv.status.toUpperCase() : 'PENDING';
    const matchesFilter = filter === 'ALL' || 
                         (filter === 'PENDING' && (invStatus === 'PENDING' || invStatus === 'DRAFT')) || 
                         invStatus === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Invoice Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track your service bills</p>
        </div>
        <Link
          to="/invoice/new"
          className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Create Invoice</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-lg w-full sm:w-auto sm:self-start">
            {['ALL', 'PENDING', 'ONGOING', 'COMPLETED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === tab 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-md sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Invoice No, Client, or Site ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-medium">No invoices found</p>
              <p className="text-sm mt-1">Try adjusting your search or create a new invoice.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <table className="hidden md:table w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                    <th className="px-6 py-4 font-semibold">Invoice Details</th>
                    <th className="px-6 py-4 font-semibold">Client & Site</th>
                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{inv.invoice_no}</div>
                        <div className="text-sm text-slate-500 flex items-center mt-1">
                          <Calendar className="w-3.5 h-3.5 mr-1.5" />
                          {new Date(inv.invoice_date).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700 flex items-center">
                          <Building className="w-4 h-4 mr-2 text-slate-400" />
                          {inv.client_name || 'N/A'}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center mt-1">
                          <MapPin className="w-3.5 h-3.5 mr-1.5" />
                          Site ID: {inv.site_id || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-800">
                        ₹{parseFloat(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={inv.status.toUpperCase()}
                          onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                          className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer outline-none border focus:ring-2 focus:ring-offset-1 transition-colors ${
                            inv.status.toUpperCase() === 'PENDING' ? 'bg-accent/20 text-yellow-700 border-accent/40 focus:ring-accent/50' :
                            inv.status.toUpperCase() === 'ONGOING' ? 'bg-secondary/10 text-secondary border-secondary/30 focus:ring-secondary/50' :
                            inv.status.toUpperCase() === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500/30' :
                            'bg-slate-50 text-slate-700 border-slate-200 focus:ring-slate-500/30'
                          }`}
                        >
                          <option value="PENDING" className="bg-white text-slate-800">Pending</option>
                          <option value="ONGOING" className="bg-white text-slate-800">Ongoing</option>
                          <option value="COMPLETED" className="bg-white text-slate-800">Completed</option>
                          {inv.status === 'draft' && <option value="DRAFT" className="bg-white text-slate-800">Draft</option>}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleDownload(inv.id, 'pdf')}
                            className="flex items-center space-x-1 px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-md transition-colors"
                            title="Download PDF"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-xs font-semibold">PDF</span>
                          </button>
                          <button
                            onClick={() => handleDownload(inv.id, 'excel')}
                            className="flex items-center space-x-1 px-2 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded-md transition-colors"
                            title="Download Excel"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span className="text-xs font-semibold">Excel</span>
                          </button>
                          <button
                            onClick={() => navigate(`/invoice/${inv.id}/edit`)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="md:hidden flex flex-col gap-4 p-4 bg-slate-50">
                {filteredInvoices.map((inv) => (
                  <div key={inv.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-800 text-lg">{inv.invoice_no}</div>
                        <div className="text-sm text-slate-500 flex items-center mt-1">
                          <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                          {new Date(inv.invoice_date).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                      <select
                        value={inv.status.toUpperCase()}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold cursor-pointer outline-none border focus:ring-2 focus:ring-offset-1 transition-colors ${
                          inv.status.toUpperCase() === 'PENDING' ? 'bg-accent/20 text-yellow-700 border-accent/40 focus:ring-accent/50' :
                          inv.status.toUpperCase() === 'ONGOING' ? 'bg-secondary/10 text-secondary border-secondary/30 focus:ring-secondary/50' :
                          inv.status.toUpperCase() === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500/30' :
                          'bg-slate-50 text-slate-700 border-slate-200 focus:ring-slate-500/30'
                        }`}
                      >
                        <option value="PENDING" className="bg-white text-slate-800">Pending</option>
                        <option value="ONGOING" className="bg-white text-slate-800">Ongoing</option>
                        <option value="COMPLETED" className="bg-white text-slate-800">Completed</option>
                        {inv.status === 'draft' && <option value="DRAFT" className="bg-white text-slate-800">Draft</option>}
                      </select>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="font-medium text-slate-700 flex items-center">
                        <Building className="w-4 h-4 mr-2 text-slate-400" />
                        {inv.client_name || 'N/A'}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center mt-2">
                        <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                        Site ID: {inv.site_id || 'N/A'}
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                      <div className="text-lg font-bold text-primary">
                        ₹{parseFloat(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(inv.id, 'pdf')}
                          className="flex items-center space-x-1 px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-md transition-colors"
                          title="Download PDF"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-xs font-semibold">PDF</span>
                        </button>
                        <button
                          onClick={() => handleDownload(inv.id, 'excel')}
                          className="flex items-center space-x-1 px-2 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded-md transition-colors"
                          title="Download Excel"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span className="text-xs font-semibold">Excel</span>
                        </button>
                        <button
                          onClick={() => navigate(`/invoice/${inv.id}/edit`)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
