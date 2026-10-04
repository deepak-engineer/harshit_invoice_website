import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, Printer } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SecurityFormsList = () => {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const navigate = useNavigate();

    const fetchForms = async () => {
        try {
            const res = await api.get('/security-forms');
            if (Array.isArray(res.data)) {
                setForms(res.data);
            } else {
                console.error("Expected array but got:", res.data);
                setForms([]);
                toast.error('Invalid response from server. Did you run the database update?');
            }
        } catch (error) {
            toast.error('Failed to load security forms');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForms();
    }, []);

    // Debounce search term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300); // 300ms delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this form?')) {
            try {
                await api.delete(`/security-forms/${id}`);
                toast.success('Form deleted successfully');
                fetchForms();
            } catch (error) {
                toast.error('Failed to delete form');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    const basePath = window.location.pathname.startsWith('/employee') ? '/employee' : '/admin';
    
    const filteredForms = forms.filter(form => 
        form.branch_code && form.branch_code.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Security Requirements Forms</h1>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 md:justify-end">
                    {/* Search Bar */}
                    <div className="relative w-full sm:max-w-xs">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by Branch Code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white/90 dark:placeholder-gray-500"
                        />
                    </div>

                    <Link to={`${basePath}/security-requirements/new`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition-colors shrink-0">
                        <Plus className="w-5 h-5" />
                        <span>Create New Form</span>
                    </Link>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6 dark:border-gray-800 dark:bg-white/3">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-y border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">ID</th>
                                <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Branch Code</th>
                                <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Address</th>
                                <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Created At</th>
                                <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredForms.map(form => (
                                <tr key={form.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="py-3 px-2 text-sm font-mono text-gray-500 dark:text-gray-400" title={form.uuid || form.id}>
                                        {form.uuid ? form.uuid.split('-')[0].toUpperCase() : form.id}
                                    </td>
                                    <td className="py-3 px-2 text-sm font-medium text-gray-800 dark:text-white/90">{form.branch_code}</td>
                                    <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{form.address}</td>
                                    <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(form.created_at).toLocaleString()}
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex space-x-3">
                                            <button onClick={() => navigate(`${basePath}/security-requirements/${form.id}/edit`)} className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500 transition-colors" title="Edit Form">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => window.open(`${basePath}/security-requirements/${form.id}/edit?print=true`, '_blank')} className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500 transition-colors" title="Download PDF">
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(form.id)} className="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-500 transition-colors" title="Delete Form">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredForms.length === 0 && (
                                <tr><td colSpan="5" className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                    {searchTerm ? 'No forms found matching your search' : 'No security forms found'}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SecurityFormsList;
