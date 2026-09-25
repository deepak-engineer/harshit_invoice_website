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
        name: '', code: '', address: '', state: '', status: 'ACTIVE', latitude: '', longitude: '', geofence_radius: 100
    });
    const [editId, setEditId] = useState(null);

    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkData, setBulkData] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Address Suggestion states
    const [addressQuery, setAddressQuery] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
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

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (addressQuery.length > 3) {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&countrycodes=in&limit=5`);
                    const data = await res.json();
                    setAddressSuggestions(data);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Failed to fetch address suggestions");
                }
            } else {
                setAddressSuggestions([]);
                setShowSuggestions(false);
            }
        };

        const timer = setTimeout(() => {
            fetchSuggestions();
        }, 500);

        return () => clearTimeout(timer);
    }, [addressQuery]);

    const fetchCoordinates = async () => {
        if (!formData.address) {
            toast.error("Please enter an address first.");
            return;
        }
        
        try {
            toast.loading("Fetching coordinates...", { id: "geocoding" });
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
                toast.success("Coordinates found and filled!", { id: "geocoding" });
            } else {
                toast.error("Could not find coordinates. Please be more specific.", { id: "geocoding" });
            }
        } catch (error) {
            toast.error("Error fetching coordinates.", { id: "geocoding" });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/admin/sites/${editId}`, formData);
                toast.success('Site updated successfully');
            } else {
                await api.post('/admin/sites', formData);
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
        setAddressQuery('');
        setShowSuggestions(false);
        setIsModalOpen(true);
    };

    const openNew = () => {
        setFormData({ name: '', code: '', address: '', state: '', status: 'ACTIVE', latitude: '', longitude: '', geofence_radius: 100 });
        setEditId(null);
        setAddressQuery('');
        setShowSuggestions(false);
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
            if (cols.length >= 2) {
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

    const autoDetectMissingCoordinates = async () => {
        const sitesToProcess = sites.filter(s => selectedIds.includes(s.id) && !s.latitude && s.address);
        if (sitesToProcess.length === 0) {
            toast.error("Please select sites that have an Address but missing Latitude.");
            return;
        }

        toast.loading(`Processing ${sitesToProcess.length} sites. Please do not close this window...`, { id: "bulk_geo" });
        
        let successCount = 0;
        let failCount = 0;

        for (const site of sitesToProcess) {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(site.address)}`);
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const { lat, lon } = data[0];
                    await api.put(`/admin/sites/${site.id}`, { ...site, latitude: lat, longitude: lon });
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                failCount++;
            }
            // Wait 1.5 seconds to respect Nominatim API limits (1 req/sec)
            await new Promise(r => setTimeout(r, 1500)); 
        }

        toast.success(`Completed! ${successCount} successful, ${failCount} failed.`, { id: "bulk_geo" });
        fetchSites();
        setSelectedIds([]);
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
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Site Management</h1>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <input 
                        type="text" 
                        placeholder="Search by Code or Name..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm w-full sm:w-64"
                    />
                    <div className="flex space-x-3 flex-wrap gap-y-2">
                    {selectedIds.length > 0 && (
                        <>
                            <button onClick={autoDetectMissingCoordinates} className="flex items-center space-x-2 bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                                <MapPin className="w-5 h-5" />
                                <span>Auto-Detect Lat/Lng</span>
                            </button>
                            <button onClick={handleBulkDelete} className="flex items-center space-x-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
                                <Trash2 className="w-5 h-5" />
                                <span>Delete ({selectedIds.length})</span>
                            </button>
                        </>
                    )}
                    <button onClick={() => setIsBulkModalOpen(true)} className="flex items-center space-x-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                        <span>Bulk Add (Paste)</span>
                    </button>
                    <button onClick={openNew} className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        <Plus className="w-5 h-5" />
                        <span>Add Single Site</span>
                    </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 w-10">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                    checked={filteredSites.length > 0 && selectedIds.length === filteredSites.length}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Site Name</th>
                            <th className="px-6 py-4">Branch Code</th>
                            <th className="px-6 py-4">State</th>
                            <th className="px-6 py-4">Address</th>
                            <th className="px-6 py-4">Operational Status</th>
                            <th className="px-6 py-4">Requirements</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredSites.map(site => (
                            <tr key={site.id} className={`hover:bg-slate-50 ${selectedIds.includes(site.id) ? 'bg-primary/5' : ''}`}>
                                <td className="px-6 py-4">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                        checked={selectedIds.includes(site.id)}
                                        onChange={() => handleSelect(site.id)}
                                    />
                                </td>
                                <td className="px-6 py-4 font-mono text-xs">{site.id}</td>
                                <td className="px-6 py-4 font-medium text-slate-800">{site.name}</td>
                                <td className="px-6 py-4">{site.code}</td>
                                <td className="px-6 py-4 font-medium text-primary">{site.state || '-'}</td>
                                <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{site.address}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded border text-xs font-semibold
                                        ${site.operational_status === 'Requirements' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                          site.operational_status === 'Panel Fault' ? 'bg-red-50 text-red-700 border-red-200' :
                                          site.operational_status === 'Pending' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                          'bg-slate-50 text-slate-600 border-slate-200'}
                                    `}>
                                        {site.operational_status || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate" title={site.requirements_note}>
                                    {site.requirements_note || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${site.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {site.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex space-x-3">
                                        <button onClick={() => openEdit(site)} className="text-blue-600 hover:text-blue-800" title="Edit Site">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(site.id)} className="text-red-600 hover:text-red-800" title="Delete Site">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredSites.length === 0 && (
                            <tr><td colSpan="10" className="text-center py-8 text-slate-400">No sites found</td></tr>
                        )}
                    </tbody>
                </table>
                </div>

                {/* Mobile Grid View */}
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50">
                    {filteredSites.map(site => (
                        <div key={site.id} className={`bg-white p-4 rounded-xl shadow-sm border ${selectedIds.includes(site.id) ? 'border-primary ring-1 ring-primary' : 'border-slate-200'} flex flex-col space-y-3`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-3">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer mt-1"
                                        checked={selectedIds.includes(site.id)}
                                        onChange={() => handleSelect(site.id)}
                                    />
                                    <div>
                                        <h3 className="font-bold text-slate-800 leading-tight">{site.name}</h3>
                                        <p className="text-xs text-slate-500 font-mono mt-0.5">{site.code} | ID: {site.id}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${site.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {site.status}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="col-span-2">
                                    <span className="text-slate-400 block mb-0.5">Address</span>
                                    <span className="font-medium text-slate-700 block truncate">{site.address}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">State</span>
                                    <span className="font-medium text-primary">{site.state || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Op. Status</span>
                                    <span className={`px-2 py-0.5 rounded border font-semibold
                                        ${site.operational_status === 'Requirements' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                          site.operational_status === 'Panel Fault' ? 'bg-red-50 text-red-700 border-red-200' :
                                          site.operational_status === 'Pending' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                          'bg-slate-50 text-slate-600 border-slate-200'}
                                    `}>
                                        {site.operational_status || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex justify-end items-center pt-2 gap-2">
                                <button onClick={() => openEdit(site)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors border border-blue-100">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(site.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-100">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredSites.length === 0 && (
                        <div className="col-span-full text-center py-8 text-slate-400 text-sm">No sites found.</div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[95vh] overflow-y-auto custom-scrollbar">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">{editId ? 'Edit Site' : 'New Site'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Branch Code</label>
                                    <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                            </div>
                            <div className="relative">
                                <div className="flex justify-between items-end mb-1">
                                    <label className="block text-sm font-medium text-slate-700">Address / Location</label>
                                    <button type="button" onClick={fetchCoordinates} className="text-xs text-primary hover:underline flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" /> Auto-fill Lat/Lng
                                    </button>
                                </div>
                                <input 
                                    type="text" 
                                    value={addressQuery || formData.address || ''} 
                                    onChange={e => {
                                        setAddressQuery(e.target.value);
                                        setFormData({...formData, address: e.target.value});
                                    }} 
                                    onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                                    placeholder="Type to search address suggestions..."
                                />
                                {showSuggestions && addressSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {addressSuggestions.map((s, idx) => (
                                            <div 
                                                key={idx} 
                                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-0"
                                                onClick={() => handleAddressSuggestionSelect(s)}
                                            >
                                                {s.display_name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                                    <input type="text" value={formData.latitude || ''} onChange={e => setFormData({...formData, latitude: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. 29.9645" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                                    <input type="text" value={formData.longitude || ''} onChange={e => setFormData({...formData, longitude: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. 77.5467" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Geofence Radius (m)</label>
                                    <input type="number" value={formData.geofence_radius || 100} onChange={e => setFormData({...formData, geofence_radius: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">State (For Holidays)</label>
                                    <select value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                                        <option value="">Select State</option>
                                        {Object.keys(holidays2026).map(st => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="INACTIVE">INACTIVE</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">Save Site</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isBulkModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl flex flex-col max-h-[90vh]">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Bulk Add Sites (Excel Paste)</h2>
                        <p className="text-sm text-slate-500 mb-4">Paste data directly from Excel. Ensure columns are ordered: <strong>Name | Branch Code | State | Address</strong></p>
                        
                        <form onSubmit={handleBulkSubmit} className="space-y-4 flex flex-col flex-1 min-h-0">
                            <textarea 
                                value={bulkData}
                                onChange={e => setBulkData(e.target.value)}
                                placeholder="e.g.&#10;Delhi Hub&#9;DEL-01&#9;Delhi&#9;Near Station&#10;Mumbai Base&#9;MUM-02&#9;Maharashtra&#9;Andheri East"
                                className="w-full flex-1 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none whitespace-pre font-mono text-sm min-h-[300px] resize-none"
                            ></textarea>
                            <div className="flex justify-end space-x-3 mt-4 shrink-0">
                                <button type="button" onClick={() => setIsBulkModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">Process & Add Sites</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiteManagement;
