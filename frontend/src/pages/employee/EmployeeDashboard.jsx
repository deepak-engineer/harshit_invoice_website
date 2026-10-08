import React, { useState, useEffect } from 'react';
import { Calendar, IndianRupee, Clock, CheckCircle, Wallet, X, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import { holidays2026 } from '../../utils/holidays2026';

const EmployeeDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [siteStatus, setSiteStatus] = useState('N/A');
    const [requirements, setRequirements] = useState('');
    const [updating, setUpdating] = useState(false);
    const [reportingSiteId, setReportingSiteId] = useState(null);
    
    // Site Assignment State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [searchState, setSearchState] = useState('');
    const [availableSites, setAvailableSites] = useState([]);
    const [isAssigning, setIsAssigning] = useState(false);
    
    // Create Site State
    const [isCreatingSite, setIsCreatingSite] = useState(false);
    const [newSiteData, setNewSiteData] = useState({ name: '', code: '', address: '', state: '', city: '' });
    const [isSubmittingSite, setIsSubmittingSite] = useState(false);
    
    // Salary Modal State
    const [salaryReportModal, setSalaryReportModal] = useState({ isOpen: false, month: new Date().getMonth() + 1, year: new Date().getFullYear(), data: null, loading: false });

    const fetchStats = async () => {
        try {
            // We fetch the basic employee data and today's attendance
            const [meRes, attRes] = await Promise.all([
                api.get('/me'),
                api.get('/me/attendance')
            ]);
            
            setStats({
                employee: meRes.data,
                today: attRes.data.today
            });
            if (meRes.data.site) {
                setSiteStatus(meRes.data.site.operational_status || 'N/A');
                setRequirements(meRes.data.site.requirements_note || '');
            }
        } catch (error) {
            console.error('Error fetching employee dashboard', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchSites = async () => {
        try {
            const res = await api.get(`/me/sites?search=${encodeURIComponent(debouncedSearch)}&state=${encodeURIComponent(searchState)}`);
            setAvailableSites(res.data);
        } catch (error) {
            console.error("Error fetching sites", error);
        }
    };

    useEffect(() => {
        fetchSites();
    }, [debouncedSearch, searchState]);

    const handleAssignSite = async (siteId) => {
        setIsAssigning(true);
        try {
            await api.post('/me/assign-site', { site_id: siteId });
            await fetchStats();
            await fetchSites();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to pick site.');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleUnassignSite = async (siteId) => {
        setIsAssigning(true);
        try {
            await api.post('/me/unassign-site', { site_id: siteId });
            alert('Site un-picked successfully!');
            await fetchStats();
            await fetchSites();
        } catch (error) {
            alert('Failed to un-pick site.');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleCreateSite = async (e) => {
        e.preventDefault();
        setIsSubmittingSite(true);
        try {
            const res = await api.post('/me/sites', newSiteData);
            if (res.data.success) {
                // Assign newly created site to employee
                await api.post('/me/assign-site', { site_id: res.data.id });
                await fetchStats();
                setIsCreatingSite(false);
                setNewSiteData({ name: '', code: '', address: '', state: '', city: '' });
                alert('Site created and assigned successfully!');
            }
        } catch (error) {
            console.error('Error creating site:', error);
            alert(error.response?.data?.error || 'Failed to create site.');
        } finally {
            setIsSubmittingSite(false);
        }
    };

    const handleUpdateStatus = async (siteId) => {
        if(!siteStatus || siteStatus === 'N/A') return;
        setUpdating(true);
        try {
            await api.post('/me/site-status', {
                site_id: siteId,
                status: siteStatus,
                requirements: siteStatus === 'Requirements' ? requirements : ''
            });
            alert('Site status updated successfully!');
            fetchStats();
            setReportingSiteId(null);
        } catch (error) {
            alert('Failed to update status.');
        } finally {
            setUpdating(false);
        }
    };

    const openSalaryReport = () => {
        const m = new Date().getMonth() + 1;
        const y = new Date().getFullYear();
        setSalaryReportModal({ isOpen: true, month: m, year: y, data: null, loading: true });
        fetchSalaryReport(m, y);
    };

    const fetchSalaryReport = async (month, year) => {
        try {
            const res = await api.get(`/me/salary-report?month=${month.toString().padStart(2, '0')}&year=${year}`);
            
            let data = res.data;
            const mStr = month.toString().padStart(2, '0');
            let holDays = 0;
            
            if (data.state && holidays2026[data.state]) {
                holidays2026[data.state].forEach(hDate => {
                    if (hDate.startsWith(`${mStr}-`)) {
                        const day = parseInt(hDate.split('-')[1], 10);
                        const d = new Date(year, month - 1, day);
                        if (d.getDay() !== 0) { // Not Sunday
                            holDays++;
                        }
                    }
                });
            }
            data.holiday_days = holDays;
            data.total_salary += (holDays * data.daily_salary);
            
            setSalaryReportModal(prev => ({ ...prev, data, loading: false }));
        } catch(err) {
            alert('Failed to load salary report');
            setSalaryReportModal(prev => ({ ...prev, loading: false }));
        }
    };

    const changeReportMonth = (direction) => {
        setSalaryReportModal(prev => {
            let m = prev.month;
            let y = prev.year;
            if (direction === 'prev') {
                m -= 1;
                if (m === 0) { m = 12; y -= 1; }
            } else {
                m += 1;
                if (m === 13) { m = 1; y += 1; }
            }
            fetchSalaryReport(m, y);
            return { ...prev, month: m, year: y, loading: true };
        });
    };

    if (loading) return <div>Loading...</div>;

    const { employee, today } = stats;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    Welcome, {employee.name} 
                    <span className="text-lg text-gray-500 dark:text-gray-400 font-normal ml-2">
                        (ID: {employee.emp_id})
                    </span>
                </h1>
                <button 
                    onClick={openSalaryReport} 
                    className="flex items-center justify-center space-x-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                >
                    <Wallet className="w-5 h-5" />
                    <span>My Salary Report</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                        <Calendar className="size-6 text-gray-800 dark:text-white/90" />
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                        <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Today's Status</span>
                            <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                                {today ? today.status : 'Not Checked In'}
                            </h4>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                        <IndianRupee className="size-6 text-gray-800 dark:text-white/90" />
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                        <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Daily Salary</span>
                            <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">₹{employee.daily_salary}</h4>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                        <Clock className="size-6 text-gray-800 dark:text-white/90" />
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                        <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Check In Time</span>
                            <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                                {today?.check_in_time ? new Date(today.check_in_time).toLocaleTimeString() : '--:--'}
                            </h4>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6 mt-6 dark:border-gray-800 dark:bg-white/3">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Your Picked Sites</h2>
                {employee.sites && employee.sites.length > 0 ? (
                    <div className="space-y-4">
                        {employee.sites.map(site => (
                            <div key={site.id} className="bg-slate-50 dark:bg-gray-800/50 p-4 rounded-xl border border-slate-100 dark:border-gray-700">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                                    <div className="mb-2 sm:mb-0">
                                        <p className="font-medium text-slate-700 dark:text-white/90 text-lg">{site.name}</p>
                                        <p className="text-sm font-semibold text-primary mb-1">Branch Code: {site.code}</p>
                                        <p className="text-sm text-slate-500 dark:text-gray-400">{site.address}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => setReportingSiteId(reportingSiteId === site.id ? null : site.id)}
                                            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            {reportingSiteId === site.id ? 'Cancel' : 'Report Status'}
                                        </button>
                                        <button 
                                            onClick={() => handleUnassignSite(site.id)}
                                            disabled={isAssigning}
                                            className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 text-sm rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                        >
                                            Un-pick
                                        </button>
                                    </div>
                                </div>

                                {reportingSiteId === site.id && (
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700 space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">Status</label>
                                            <select 
                                                value={siteStatus} 
                                                onChange={(e) => setSiteStatus(e.target.value)}
                                                className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
                                            >
                                                <option value="N/A">N/A</option>
                                                <option value="Panel Fault">Panel Fault</option>
                                                <option value="Requirements">Requirements</option>
                                            </select>
                                        </div>
                                        {siteStatus === 'Requirements' && (
                                            <div>
                                                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">Requirements Details</label>
                                                <textarea 
                                                    value={requirements}
                                                    onChange={(e) => setRequirements(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
                                                    rows="2"
                                                    placeholder="Type your requirements here..."
                                                ></textarea>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => handleUpdateStatus(site.id)}
                                            disabled={updating}
                                            className="px-4 py-1.5 bg-primary text-white text-sm rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            {updating ? 'Updating...' : 'Save Status'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">No sites picked yet. Search and pick a site below.</p>
                )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6 mt-6 dark:border-gray-800 dark:bg-white/3">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Available Sites</h2>
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                            <input 
                                type="text" 
                                placeholder="Search site by Name or Branch Code..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-white/90"
                            />
                            <select
                                value={searchState}
                                onChange={(e) => setSearchState(e.target.value)}
                                className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-white/90 min-w-[150px]"
                            >
                                <option value="">All States</option>
                                {Object.keys(holidays2026).sort().map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>
                        {availableSites.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 border border-slate-100 dark:border-gray-700 rounded-lg p-2">
                                {availableSites.map(site => (
                                    <div key={site.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-gray-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors border border-transparent dark:border-gray-700">
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-white/90 text-sm flex items-center gap-2">
                                                <span>{site.name}</span>
                                                {site.operational_status && (
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                                                        ${site.operational_status === 'Requirements' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 
                                                          site.operational_status === 'Panel Fault' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                          'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
                                                    >
                                                        {site.operational_status}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-gray-400">Branch Code: {site.code} - {site.city || site.address}</p>
                                        </div>
                                        {employee?.sites?.some(s => s.id === site.id) ? (
                                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/20 flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Picked by you
                                            </span>
                                        ) : site.picked_by_name ? (
                                            <span className="text-xs font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-md border border-amber-200 dark:border-amber-500/20">
                                                Picked by {site.picked_by_name}
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => handleAssignSite(site.id)}
                                                disabled={isAssigning}
                                                className="px-4 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                                            >
                                                Pick
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 p-2 text-center">No sites found matching "{searchTerm}"</p>
                        )}
                </div>
            </div>
            
            <div className="rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6 mt-6 dark:border-gray-800 dark:bg-white/3">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Assigned Team</h2>
                {employee.team ? (
                    <div>
                        <div className="mb-4">
                            <p className="font-medium text-slate-700 text-lg">{employee.team.name}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">No team assigned yet.</p>
                )}
            </div>
            

            
            {/* Salary Report Modal */}
            {salaryReportModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <Wallet className="w-5 h-5 mr-2 text-primary" />
                                My Salary Report
                            </h3>
                            <button 
                                onClick={() => setSalaryReportModal({ isOpen: false, data: null })}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                            <button onClick={() => changeReportMonth('prev')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h4 className="font-bold text-slate-700 bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-100">
                                {new Date(salaryReportModal.year, salaryReportModal.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h4>
                            <button onClick={() => changeReportMonth('next')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
                            {salaryReportModal.loading ? (
                                <div className="flex justify-center items-center py-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : salaryReportModal.data ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center transform transition-transform hover:scale-105">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Present</div>
                                            <div className="text-3xl font-black text-green-600">{salaryReportModal.data.present_days}</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center transform transition-transform hover:scale-105">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Half Days</div>
                                            <div className="text-3xl font-black text-amber-500">{salaryReportModal.data.half_days}</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center transform transition-transform hover:scale-105">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Holidays</div>
                                            <div className="text-3xl font-black text-blue-500">{salaryReportModal.data.holiday_days || 0}</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center transform transition-transform hover:scale-105">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Absent</div>
                                            <div className="text-3xl font-black text-red-500">{salaryReportModal.data.absent_days}</div>
                                        </div>
                                        <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 shadow-sm text-center transform transition-transform hover:scale-105 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                                            <div className="text-xs font-bold text-primary/80 uppercase tracking-wider mb-1 relative z-10">Total</div>
                                            <div className="text-2xl font-black text-primary relative z-10">₹{salaryReportModal.data.total_salary.toFixed(2)}</div>
                                        </div>
                                    </div>
                                    
                                    {salaryReportModal.data.state && (
                                        <div className="text-xs text-slate-500 text-center">
                                            Holidays calculated for: <strong className="text-slate-700">{salaryReportModal.data.state}</strong>
                                        </div>
                                    )}
                                    
                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                                                <tr>
                                                    <th className="px-6 py-3">Date</th>
                                                    <th className="px-6 py-3 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {salaryReportModal.data.records.length > 0 ? (
                                                    salaryReportModal.data.records.map((r, i) => (
                                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-3 font-medium text-slate-700">
                                                                {new Date(r.attendance_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td className="px-6 py-3 text-right">
                                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                                                                    r.status === 'PRESENT' || r.status === 'WORKING' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                    r.status === 'HALF_DAY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                    'bg-red-50 text-red-700 border-red-200'
                                                                }`}>
                                                                    {r.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="2" className="px-6 py-8 text-center text-slate-400 italic">
                                                            No attendance records found for {new Date(salaryReportModal.year, salaryReportModal.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 py-10">Failed to load data</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;
