import React, { useState, useEffect } from 'react';
import { Receipt, Search, Filter, CheckCircle, XCircle, Clock, MapPin, Users, Download, IndianRupee, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [teamFilter, setTeamFilter] = useState('');
    const [stateFilter, setStateFilter] = useState('');
    
    // Extracted unique teams and states for filters
    const [teams, setTeams] = useState([]);
    const [states, setStates] = useState([]);

    const [selectedExpense, setSelectedExpense] = useState(null);
    const [viewingPhoto, setViewingPhoto] = useState(null);

    useEffect(() => {
        fetchExpenses();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/expenses');
            const data = res.data || [];
            setExpenses(data);
            
            // Extract unique teams and states
            const uniqueTeams = [...new Set(data.map(item => item.team_name).filter(Boolean))];
            const uniqueStates = [...new Set(data.map(item => item.state).filter(Boolean))];
            setTeams(uniqueTeams);
            setStates(uniqueStates);
        } catch (err) {
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/expenses/${id}/status`, { status });
            toast.success(`Expense ${status.toLowerCase()} successfully`);
            if (selectedExpense && selectedExpense.id === id) {
                setSelectedExpense({ ...selectedExpense, status });
            }
            fetchExpenses();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expense? This cannot be undone.")) return;
        try {
            await api.delete(`/expenses/${id}`);
            toast.success("Expense deleted successfully");
            setSelectedExpense(null);
            fetchExpenses();
        } catch (err) {
            toast.error("Failed to delete expense");
        }
    };

    const filteredExpenses = expenses.filter(exp => {
        const matchesSearch = debouncedSearch === '' || 
            exp.emp_name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
            (exp.description && exp.description.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
            exp.emp_code.toLowerCase().includes(debouncedSearch.toLowerCase());
            
        const matchesStatus = statusFilter === 'ALL' || exp.status === statusFilter;
        const matchesTeam = teamFilter === '' || exp.team_name === teamFilter;
        const matchesState = stateFilter === '' || exp.state === stateFilter;
        
        return matchesSearch && matchesStatus && matchesTeam && matchesState;
    });

    const totalAmount = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

    const teamExpenses = filteredExpenses.reduce((acc, exp) => {
        const t = exp.team_name || 'No Team';
        acc[t] = (acc[t] || 0) + parseFloat(exp.amount || 0);
        return acc;
    }, {});

    const getStatusIcon = (status) => {
        if (status === 'APPROVED') return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (status === 'REJECTED') return <XCircle className="w-4 h-4 text-red-500" />;
        return <Clock className="w-4 h-4 text-amber-500" />;
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                            <Receipt className="w-7 h-7 mr-3 text-primary" />
                            Expense Tracker
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Track and manage employee expenses by site/team</p>
                    </div>
                    
                    <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between min-w-[200px]">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total (Filtered)</p>
                            <p className="text-xl font-bold text-slate-800 flex items-center">
                                <IndianRupee className="w-5 h-5 mr-1 text-primary" />
                                {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Team-wise Summary Breakdown */}
                {Object.keys(teamExpenses).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {Object.entries(teamExpenses).map(([team, amount]) => (
                            <div key={team} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate mb-1" title={team}>{team}</span>
                                <span className="text-xl font-black text-primary">₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center gap-4">
                    
                    <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-lg shrink-0">
                        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setStatusFilter(tab)}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                                    statusFilter === tab 
                                        ? 'bg-white text-primary shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-1 flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search employee..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                        <select 
                            value={stateFilter} 
                            onChange={e => setStateFilter(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-white"
                        >
                            <option value="">All States/Sites</option>
                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select 
                            value={teamFilter} 
                            onChange={e => setTeamFilter(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-white"
                        >
                            <option value="">All Teams</option>
                            {teams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            No expenses found matching the criteria.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Location & Team</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 text-right">Amount (₹)</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredExpenses.map((exp) => (
                                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{exp.emp_name}</div>
                                            <div className="text-xs text-slate-400">ID: {exp.emp_code}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-slate-700">
                                                <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                                {exp.state || 'N/A'}
                                            </div>
                                            <div className="flex items-center text-slate-500 mt-1 text-xs">
                                                <Users className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                                {exp.team_name || 'No Team'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-slate-700">{exp.category}</span>
                                            {exp.description && (
                                                <div className="text-xs text-slate-500 truncate max-w-[150px]" title={exp.description}>
                                                    {exp.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-slate-800">
                                                {parseFloat(exp.amount).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(exp.expense_date).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                exp.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                exp.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {getStatusIcon(exp.status)}
                                                <span className="ml-1.5">{exp.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => setSelectedExpense(exp)}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Mobile Grid View */}
                {!loading && (
                    <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50">
                        {filteredExpenses.map((exp) => (
                            <div key={exp.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-800 leading-tight">{exp.emp_name}</h3>
                                        <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {exp.emp_code}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                                        exp.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                        exp.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                        'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                        {exp.status}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="col-span-2 flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                                        <div>
                                            <span className="text-slate-400 block mb-0.5">Category</span>
                                            <span className="font-semibold text-slate-700">{exp.category}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-slate-400 block mb-0.5">Amount</span>
                                            <span className="font-bold text-slate-800 text-sm">₹{parseFloat(exp.amount).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">Location</span>
                                        <span className="font-medium text-slate-700 flex items-center">
                                            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                            {exp.state || 'N/A'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">Team</span>
                                        <span className="font-medium text-slate-700 flex items-center truncate">
                                            <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                            {exp.team_name || 'No Team'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="pt-2">
                                    <button 
                                        onClick={() => setSelectedExpense(exp)}
                                        className="w-full px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg text-sm transition-colors border border-primary/20"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredExpenses.length === 0 && (
                            <div className="col-span-full text-center py-8 text-slate-400 text-sm">No expenses found.</div>
                        )}
                    </div>
                )}
            </div>

            {/* View / Process Modal */}
            {selectedExpense && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">Expense Details</h2>
                            <button onClick={() => setSelectedExpense(null)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{selectedExpense.emp_name}</h3>
                                    <p className="text-sm text-slate-500">ID: {selectedExpense.emp_code}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary flex items-center justify-end">
                                        <IndianRupee className="w-5 h-5 mr-1" />
                                        {parseFloat(selectedExpense.amount).toFixed(2)}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-600">{selectedExpense.category}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">State / Site</p>
                                    <p className="text-sm font-semibold text-slate-700 flex items-center">
                                        <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                                        {selectedExpense.state || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Team</p>
                                    <p className="text-sm font-semibold text-slate-700 flex items-center">
                                        <Users className="w-4 h-4 mr-1.5 text-slate-400" />
                                        {selectedExpense.team_name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                                    <p className="text-sm font-semibold text-slate-700">
                                        {new Date(selectedExpense.expense_date).toLocaleDateString('en-GB')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                                        selectedExpense.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                        selectedExpense.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                        'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                        {selectedExpense.status}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                                <p className="text-sm text-slate-700 bg-white border border-slate-200 p-3 rounded-xl min-h-[60px]">
                                    {selectedExpense.description || <span className="text-slate-400 italic">No description provided</span>}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Receipt / Bill Photo</p>
                                {selectedExpense.receipt_photo ? (
                                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex justify-center cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setViewingPhoto(`${api.defaults.baseURL.replace(/\/api$/, '')}/uploads/expenses/${selectedExpense.receipt_photo}`)}>
                                        <img 
                                            src={`${api.defaults.baseURL.replace(/\/api$/, '')}/uploads/expenses/${selectedExpense.receipt_photo}`} 
                                            alt="Receipt" 
                                            className="max-h-64 object-contain"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/10 transition-opacity">
                                            <span className="bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-semibold backdrop-blur-sm shadow-lg">Click to Enlarge</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 border border-dashed border-slate-200 p-6 rounded-xl text-center text-slate-400">
                                        No receipt attached
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <button 
                                onClick={() => handleDeleteExpense(selectedExpense.id)}
                                className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2.5 rounded-xl font-bold transition-colors shadow-sm flex items-center justify-center"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Expense
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Viewer Modal */}
            {viewingPhoto && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
                    onClick={() => setViewingPhoto(null)}
                >
                    <button 
                        className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-all"
                        onClick={() => setViewingPhoto(null)}
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                    <div 
                        className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={viewingPhoto} 
                            alt="Enlarged Receipt" 
                            className="w-auto h-auto max-w-full max-h-[90vh] object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminExpenses;
