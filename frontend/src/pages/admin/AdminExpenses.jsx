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
        if (status === 'REJECTED') return <XCircle className="w-4 h-4 text-error-500 dark:text-error-400" />;
        return <Clock className="w-4 h-4 text-warning-500 dark:text-warning-400" />;
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 flex items-center">
                            <Receipt className="w-7 h-7 mr-3 text-brand-500" />
                            Expense Tracker
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track and manage employee expenses by site/team</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 px-5 py-3 rounded-2xl shadow-theme-xs border border-gray-100 dark:border-gray-800 flex items-center justify-between min-w-[200px]">
                        <div>
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Total (Filtered)</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white/90 flex items-center">
                                <IndianRupee className="w-5 h-5 mr-1 text-brand-500" />
                                {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Team-wise Summary Breakdown */}
                {Object.keys(teamExpenses).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {Object.entries(teamExpenses).map(([team, amount]) => (
                            <div key={team} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-xs flex flex-col justify-between hover:border-brand-500/50 transition-colors">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate mb-1" title={team}>{team}</span>
                                <span className="text-xl font-black text-brand-500">₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-theme-xs border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-col lg:flex-row lg:items-center gap-4">
                    
                    <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0 w-full sm:w-auto">
                        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setStatusFilter(tab)}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all text-center w-full ${
                                    statusFilter === tab 
                                        ? 'bg-white dark:bg-gray-900 text-brand-500 shadow-theme-xs' 
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-1 flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search employee..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>
                        <select 
                            value={stateFilter} 
                            onChange={e => setStateFilter(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-gray-900"
                        >
                            <option value="">All States/Sites</option>
                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select 
                            value={teamFilter} 
                            onChange={e => setTeamFilter(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-gray-900"
                        >
                            <option value="">All Teams</option>
                            {teams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                <div className="w-full">
                    {loading ? (
                        <div className="p-12 text-center flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                            No expenses found matching the criteria.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-800 text-[10px] md:text-sm">
                                <tr>
                                    <th className="px-2 py-2 md:px-6 md:py-4">Employee</th>
                                    <th className="px-2 py-2 md:px-6 md:py-4 hidden sm:table-cell">Location & Team</th>
                                    <th className="px-2 py-2 md:px-6 md:py-4">Category</th>
                                    <th className="px-2 py-2 md:px-6 md:py-4 text-right">Amount (₹)</th>
                                    <th className="px-2 py-2 md:px-6 md:py-4 hidden md:table-cell">Date</th>
                                    <th className="px-2 py-2 md:px-6 md:py-4 text-center">Status</th>
                                    <th className="px-2 py-2 md:px-6 md:py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredExpenses.map((exp) => (
                                    <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <td className="px-2 py-2 md:px-6 md:py-4">
                                            <div className="font-bold text-[10px] md:text-sm text-gray-800 dark:text-white/90 truncate max-w-[80px] md:max-w-none">{exp.emp_name}</div>
                                            <div className="text-[8px] md:text-xs text-gray-400 dark:text-gray-500 hidden sm:block">ID: {exp.emp_code}</div>
                                        </td>
                                        <td className="px-2 py-2 md:px-6 md:py-4 hidden sm:table-cell">
                                            <div className="flex items-center text-[10px] md:text-sm text-gray-700 dark:text-gray-300 truncate max-w-[80px] md:max-w-none">
                                                <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5 text-gray-400 dark:text-gray-500 shrink-0" />
                                                <span className="truncate">{exp.state || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1 text-[8px] md:text-xs truncate max-w-[80px] md:max-w-none">
                                                <Users className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5 text-gray-400 dark:text-gray-500 shrink-0" />
                                                <span className="truncate">{exp.team_name || 'No Team'}</span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 md:px-6 md:py-4">
                                            <span className="font-semibold text-[10px] md:text-sm text-gray-700 dark:text-gray-300">{exp.category}</span>
                                        </td>
                                        <td className="px-2 py-2 md:px-6 md:py-4 text-right">
                                            <span className="font-bold text-[10px] md:text-sm text-gray-800 dark:text-white/90">
                                                {parseFloat(exp.amount).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                            {new Date(exp.expense_date).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="px-2 py-2 md:px-6 md:py-4 text-center">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full text-[8px] md:text-xs font-bold border ${
                                                exp.status === 'APPROVED' ? 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400 border-success-200 dark:border-success-800' :
                                                exp.status === 'REJECTED' ? 'bg-error-50 dark:bg-error-500/10 text-red-700 border-error-200 dark:border-error-800' :
                                                'bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-400 border-warning-200 dark:border-warning-800'
                                            }`}>
                                                <span className="hidden sm:inline-block">{getStatusIcon(exp.status)}</span>
                                                <span className="sm:ml-1.5">{exp.status === 'PENDING' ? 'PEN' : exp.status === 'APPROVED' ? 'APP' : 'REJ'}</span>
                                            </span>
                                        </td>
                                        <td className="px-2 py-2 md:px-6 md:py-4 text-center">
                                            <button 
                                                onClick={() => setSelectedExpense(exp)}
                                                className="px-1.5 py-1 md:px-3 md:py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded md:rounded-lg text-[10px] md:text-xs transition-colors"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>

            {/* View / Process Modal */}
            {selectedExpense && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Expense Details</h2>
                            <button onClick={() => setSelectedExpense(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white/90">{selectedExpense.emp_name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: {selectedExpense.emp_code}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-brand-500 flex items-center justify-end">
                                        <IndianRupee className="w-5 h-5 mr-1" />
                                        {parseFloat(selectedExpense.amount).toFixed(2)}
                                    </p>
                                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{selectedExpense.category}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">State / Site</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                                        <MapPin className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                                        {selectedExpense.state || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Team</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                                        <Users className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                                        {selectedExpense.team_name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Date</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {new Date(selectedExpense.expense_date).toLocaleDateString('en-GB')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Status</p>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                                        selectedExpense.status === 'APPROVED' ? 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400 border-success-200 dark:border-success-800' :
                                        selectedExpense.status === 'REJECTED' ? 'bg-error-50 dark:bg-error-500/10 text-red-700 border-error-200 dark:border-error-800' :
                                        'bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-400 border-warning-200 dark:border-warning-800'
                                    }`}>
                                        {selectedExpense.status}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Description</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-xl min-h-[60px]">
                                    {selectedExpense.description || <span className="text-gray-400 dark:text-gray-500 italic">No description provided</span>}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Receipt / Bill Photo</p>
                                {selectedExpense.receipt_photo ? (
                                    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex justify-center cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setViewingPhoto(`${api.defaults.baseURL.replace(/\/api$/, '')}/uploads/expenses/${selectedExpense.receipt_photo}`)}>
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
                                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-800 p-6 rounded-xl text-center text-gray-400 dark:text-gray-500">
                                        No receipt attached
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
                            <button 
                                onClick={() => handleDeleteExpense(selectedExpense.id)}
                                className="w-full bg-error-50 dark:bg-error-500/10 hover:bg-error-100 dark:bg-error-500/20 text-error-600 dark:text-error-500 border border-error-200 dark:border-error-800 py-2.5 rounded-xl font-bold transition-colors shadow-theme-xs flex items-center justify-center"
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
