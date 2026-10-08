import React, { useState, useEffect } from 'react';
import { MapPin, Search, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const EmployeeSites = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);
    const [currentSiteId, setCurrentSiteId] = useState(null);

    // Get current employee site
    const fetchCurrentSite = async () => {
        try {
            const res = await api.get('/me');
            if (res.data.site) {
                setCurrentSiteId(res.data.site.id);
            }
        } catch (error) {
            console.error('Failed to fetch current site', error);
        }
    };

    // Fetch sites matching search
    const fetchSites = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/me/sites?search=${encodeURIComponent(debouncedSearch)}`);
            setSites(res.data);
        } catch (error) {
            toast.error('Failed to load sites');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentSite();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchSites();
    }, [debouncedSearch]);

    const handleAssignSite = async (siteId) => {
        setIsAssigning(true);
        try {
            await api.post('/me/assign-site', { site_id: siteId });
            toast.success('Site assigned successfully!');
            setCurrentSiteId(siteId);
            // Re-fetch to update any status UI if needed
            fetchCurrentSite();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to assign site.');
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Pick a Site</h1>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search sites by Branch Code or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-colors text-gray-800 dark:text-white/90"
                    />
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                        </div>
                    ) : sites.length > 0 ? (
                        sites.map(site => {
                            const isCurrent = site.id === currentSiteId;
                            return (
                                <div 
                                    key={site.id} 
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                                        isCurrent 
                                        ? 'bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-500/30' 
                                        : 'bg-white border-gray-100 hover:border-gray-300 dark:bg-gray-800/50 dark:border-gray-700 dark:hover:border-gray-600'
                                    }`}
                                >
                                    <div className="flex items-start mb-3 sm:mb-0">
                                        <div className={`p-2 rounded-lg mr-4 shrink-0 ${isCurrent ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-white/90">{site.name}</h3>
                                            <p className="text-sm font-semibold text-brand-500 mb-1">Code: {site.code}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{site.city ? `${site.city}, ` : ''}{site.state || site.address}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex items-center">
                                        {isCurrent ? (
                                            <div className="flex items-center text-success-600 font-medium bg-success-50 dark:bg-success-900/20 px-4 py-2 rounded-lg">
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                Currently Assigned
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAssignSite(site.id)}
                                                disabled={isAssigning}
                                                className="w-full sm:w-auto px-6 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 shadow-sm"
                                            >
                                                Assign
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No sites found</p>
                            <p className="text-sm text-gray-400">Try searching for a different branch code or name.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeSites;
