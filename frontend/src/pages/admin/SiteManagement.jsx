import React, { useState, useEffect } from 'react';
import { Plus, Edit2, MapPin, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { holidays2026 } from '../../utils/holidays2026';

const SiteManagement = () => {
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '', code: '', address: '', city: '', state: '', status: 'ACTIVE', latitude: '', longitude: '', geofence_radius: 100
    });
    const [editId, setEditId] = useState(null);

    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkData, setBulkData] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    

    // Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filteredSites, setFilteredSites] = useState([]);

    const fetchSites = async () => {
        try {
            const res = await api.get('/admin/sites');
            setSites(res.data);
        } catch (error) {
            toast.error('Failed to load sites');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (!debouncedSearch) {
            setFilteredSites(sites);
        } else {
            const lowerSearch = debouncedSearch.toLowerCase();
            setFilteredSites(sites.filter(site => 
                (site.code && site.code.toLowerCase().includes(lowerSearch)) ||
                (site.name && site.name.toLowerCase().includes(lowerSearch)) ||
                (site.id && site.id.toString() === lowerSearch)
            ));
        }
    }, [debouncedSearch, sites]);



    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let currentData = { ...formData };
            let savedId = editId;

            if (editId) {
                await api.put(`/admin/sites/${editId}`, currentData);
                toast.success('Site updated successfully');
            } else {
                const res = await api.post('/admin/sites', currentData);
                savedId = res.data.id;
                toast.success('Site created successfully');
            }

            setIsModalOpen(false);
            fetchSites();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this site?')) {
            try {
                await api.delete(`/admin/sites/${id}`);
                toast.success('Site deleted successfully');
                fetchSites();
            } catch (error) {
                toast.error(error.response?.data?.error || 'Failed to delete site');
            }
        }
    };

    const openEdit = (site) => {
        setFormData(site);
        setEditId(site.id);
        setIsModalOpen(true);
    };

    const openNew = () => {
        setFormData({ name: '', code: '', address: '', city: '', state: '', status: 'ACTIVE', latitude: '', longitude: '', geofence_radius: 100 });
        setEditId(null);
        setIsModalOpen(true);
    };

    const handleAddressSuggestionSelect = (suggestion) => {
        setFormData({ 
            ...formData, 
            address: suggestion.display_name,
            latitude: suggestion.lat,
            longitude: suggestion.lon
        });
        setAddressQuery('');
        setShowSuggestions(false);
        toast.success("Address and coordinates auto-filled!", { id: "geocoding" });
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        if (!bulkData.trim()) {
            toast.error("Please paste some data first.");
            return;
        }

        const lines = bulkData.trim().split('\n');
        const sitesToAdd = [];

        lines.forEach(line => {
            const cols = line.split('\t');
            if (cols.length >= 7) {
                // HDFC Format: Bank Name | ATM ID | Status | Location | State | city | Address | Zone
                sitesToAdd.push({
                    name: cols[0]?.trim() || '',
                    code: cols[1]?.trim() || '',
                    state: cols[4]?.trim() || '',
                    city: cols[5]?.trim() || '',
                    address: cols[6]?.trim() || ''
                });
            } else if (cols.length >= 2) {
                // Standard Format: Name | Branch Code | State | Address
                sitesToAdd.push({
                    name: cols[0]?.trim() || '',
                    code: cols[1]?.trim() || '',
                    state: cols[2]?.trim() || '',
                    address: cols[3]?.trim() || ''
                });
            }
        });

        if (sitesToAdd.length === 0) {
            toast.error("Could not parse data. Ensure it is tab-separated.");
            return;
        }

        try {
            const res = await api.post('/admin/sites/bulk', { sites: sitesToAdd });
            toast.success(`Successfully added ${res.data.added} sites`);
            setIsBulkModalOpen(false);
            setBulkData('');
            fetchSites();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Bulk operation failed');
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredSites.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };



    const handleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} sites?`)) {
            try {
                await api.post('/admin/sites/bulk-delete', { ids: selectedIds });
                toast.success('Sites deleted successfully');
                setSelectedIds([]);
                fetchSites();
            } catch (error) {
                toast.error(error.response?.data?.error || 'Failed to delete sites');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Site Management</h1>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <input 
                        type="text" 
                        placeholder="Search by Code or Name..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-theme-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-500"
                    />
                    <div className="flex space-x-3 flex-wrap gap-y-2">
                    {selectedIds.length > 0 && (
                        <>
                            <button onClick={handleBulkDelete} className="inline-flex items-center justify-center gap-2 rounded-lg bg-error-50 px-4 py-2 text-theme-sm font-medium text-error-600 border border-error-200 hover:bg-error-100 transition-colors">
                                <Trash2 className="w-5 h-5" />
                                <span>Delete ({selectedIds.length})</span>
                            </button>
                        </>
                    )}
                    <button onClick={() => setIsBulkModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 transition-colors">
                        <span>Bulk Add (Paste)</span>
                    </button>
                    <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition-colors">
                        <Plus className="w-5 h-5" />
                        <span>Add Single Site</span>
                    </button>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6 dark:border-gray-800 dark:bg-white/3">
                <div className="hidden lg:block max-w-full overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-y border-gray-100 dark:border-gray-800">
                        <tr>
                            <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2 w-10">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                                    checked={filteredSites.length > 0 && selectedIds.length === filteredSites.length}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">ID</th>
                            <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Site Name</th>
                            <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Branch Code</th>
                            <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">State</th>
                            <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Address</th>
                            <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Operational Status</th>
                            <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Requirements</th>
                            <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Status</th>
                            <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredSites.map(site => (
                            <tr key={site.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedIds.includes(site.id) ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''}`}>
                                <td className="py-3 px-2">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                                        checked={selectedIds.includes(site.id)}
                                        onChange={() => handleSelect(site.id)}
                                    />
                                </td>
                                <td className="py-3 px-2 text-sm font-mono text-gray-500 dark:text-gray-400">{site.id}</td>
                                <td className="py-3 px-2 text-sm font-medium text-gray-800 dark:text-white/90">{site.name}</td>
                                <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">{site.code}</td>
                                <td className="py-3 px-2 text-sm font-medium text-brand-500">{site.state || '-'}</td>
                                <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{site.address}</td>
                                <td className="py-3 px-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                        ${site.operational_status === 'Requirements' ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400' : 
                                          site.operational_status === 'Panel Fault' ? 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400' :
                                          site.operational_status === 'Pending' ? 'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/10 dark:text-blue-light-400' :
                                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}
                                    `}>
                                        {site.operational_status || 'N/A'}
                                    </span>
                                </td>
                                <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={site.requirements_note}>
                                    {site.requirements_note || '-'}
                                </td>
                                <td className="py-3 px-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${site.status === 'ACTIVE' ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400' : 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400'}`}>
                                        {site.status}
                                    </span>
                                </td>
                                <td className="py-3 px-2">
                                    <div className="flex space-x-3">
                                        <button onClick={() => openEdit(site)} className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500 transition-colors" title="Edit Site">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(site.id)} className="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-500 transition-colors" title="Delete Site">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredSites.length === 0 && (
                            <tr><td colSpan="10" className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No sites found</td></tr>
                        )}
                    </tbody>
                </table>
                </div>

                {/* Mobile Grid View */}
                <div className="lg:hidden mt-4 space-y-4">
                    {filteredSites.map(site => (
                        <div key={site.id} className={`rounded-xl border bg-white p-4 dark:bg-white/3 flex flex-col space-y-3 ${selectedIds.includes(site.id) ? 'border-brand-500 ring-1 ring-brand-500' : 'border-gray-200 dark:border-gray-800'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-3">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer mt-1"
                                        checked={selectedIds.includes(site.id)}
                                        onChange={() => handleSelect(site.id)}
                                    />
                                    <div>
                                        <h3 className="font-medium text-gray-800 dark:text-white/90 leading-tight">{site.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{site.code} | ID: {site.id}</p>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${site.status === 'ACTIVE' ? 'bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400' : 'bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400'}`}>
                                    {site.status}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                <div className="col-span-2">
                                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Address</span>
                                    <span className="font-medium text-gray-800 dark:text-white/90 block truncate">{site.address}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5">State</span>
                                    <span className="font-medium text-brand-500">{site.state || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Op. Status</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium
                                        ${site.operational_status === 'Requirements' ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400' : 
                                          site.operational_status === 'Panel Fault' ? 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400' :
                                          site.operational_status === 'Pending' ? 'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/10 dark:text-blue-light-400' :
                                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}
                                    `}>
                                        {site.operational_status || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex justify-end items-center pt-2 gap-2">
                                <button onClick={() => openEdit(site)} className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-brand-500 hover:border-brand-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-brand-800 dark:hover:text-brand-500 transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(site.id)} className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-error-500 hover:border-error-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-error-800 dark:hover:text-error-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredSites.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400 text-sm">No sites found.</div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[95vh] overflow-y-auto custom-scrollbar">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-4">{editId ? 'Edit Site' : 'New Site'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-theme-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">ATM ID (Branch Code)</label>
                                    <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-theme-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                                <input type="text" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-theme-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90" />
                            </div>
                            
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Full Address</label>
                                <textarea value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} rows="3" className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-theme-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90" placeholder="Enter full address..."></textarea>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">State (For Holidays)</label>
                                    <select value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-theme-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90 dark:bg-gray-900">
                                        <option value="">Select State</option>
                                        {Object.keys(holidays2026).map(st => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-theme-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90 dark:bg-gray-900">
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="INACTIVE">INACTIVE</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3">Cancel</button>
                                <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition-colors">Save Site</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isBulkModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-xl flex flex-col max-h-[90vh]">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">Bulk Add Sites (Excel Paste)</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Paste data directly from Excel. The system supports two formats: <br/>1. Standard: <strong>Name | Branch Code | State | Address</strong><br/>2. HDFC Format: <strong>Bank Name | ATM ID | Status | Location | State | City | Address | Zone</strong></p>
                        
                        <form onSubmit={handleBulkSubmit} className="space-y-4 flex flex-col flex-1 min-h-0">
                            <textarea 
                                value={bulkData}
                                onChange={e => setBulkData(e.target.value)}
                                placeholder="e.g.&#10;Delhi Hub&#9;DEL-01&#9;Delhi&#9;Near Station&#10;Mumbai Base&#9;MUM-02&#9;Maharashtra&#9;Andheri East"
                                className="w-full flex-1 rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-theme-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90 whitespace-pre font-mono min-h-[300px] resize-none"
                            ></textarea>
                            <div className="flex justify-end space-x-3 mt-4 shrink-0 pt-4 border-t border-gray-200 dark:border-gray-800">
                                <button type="button" onClick={() => setIsBulkModalOpen(false)} className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3">Cancel</button>
                                <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition-colors">Process & Add Sites</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiteManagement;
