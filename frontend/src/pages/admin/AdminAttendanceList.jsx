import React, { useState, useEffect } from 'react';
import { Calendar, Filter, MapPin, Camera, Clock } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminAttendanceList = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterState, setFilterState] = useState('ALL');
    
    // Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/attendance-list?date=${filterDate}`);
            setRecords(res.data);
        } catch (error) {
            toast.error('Failed to load attendance list');
        } finally {
            setLoading(false);
        }
    };

    const uniqueStates = [...new Set(records.map(r => r.state || 'N/A'))].filter(Boolean);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const filteredRecords = records.filter(r => {
        const stateMatch = filterState === 'ALL' || (r.state || 'N/A') === filterState;
        if (!stateMatch) return false;
        
        if (!debouncedSearch) return true;
        const lowerSearch = debouncedSearch.toLowerCase();
        return (
            (r.emp_name && r.emp_name.toLowerCase().includes(lowerSearch)) ||
            (r.emp_code && r.emp_code.toLowerCase().includes(lowerSearch))
        );
    });

    const exportCSV = () => {
        const headers = ["Employee", "Emp Code", "Team", "State", "Site", "Check-in", "Check-out", "Distance (m)", "Status"];
        const rows = filteredRecords.map(r => [
            `"${r.emp_name}"`, 
            `"${r.emp_code}"`, 
            `"${r.team_name || ''}"`, 
            `"${r.state || ''}"`, 
            `"${r.site_name || ''}"`,
            `"${r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : ''}"`,
            `"${r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : ''}"`,
            r.check_in_distance || '',
            `"${r.status}"`
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Attendance_${filterDate}_${filterState}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetchRecords();
    }, [filterDate]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-theme-xs border border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-brand-500/10 text-brand-500 rounded-xl">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Attendance</h1>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <input 
                        type="text" 
                        placeholder="Search Employee..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <input 
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <select
                        value={filterState}
                        onChange={(e) => setFilterState(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-gray-900 min-w-[140px]"
                    >
                        <option value="ALL">All States</option>
                        {uniqueStates.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                    <button onClick={fetchRecords} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:bg-gray-700">
                        <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button onClick={exportCSV} className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-theme-xs border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Team & State</th>
                                <th className="px-6 py-4">Site</th>
                                <th className="px-6 py-4">Check-in</th>
                                <th className="px-6 py-4">Check-out</th>
                                <th className="px-6 py-4">Distance (m)</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">No records found for this date.</td>
                                </tr>
                            ) : filteredRecords.map(record => (
                                <tr key={record.id} className="hover:bg-gray-50 dark:bg-gray-800/50">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-800 dark:text-white/90">{record.emp_name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{record.emp_code}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-700 dark:text-gray-300">{record.team_name || 'N/A'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{record.state || 'N/A'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-700 dark:text-gray-300">{record.site_name || 'No Site'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{record.site_code}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.check_in_time ? (
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                                <span>{new Date(record.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.check_out_time ? (
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                                <span>{new Date(record.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        ) : '-'}
                                        {record.working_minutes > 0 && (
                                            <p className="text-xs text-brand-500 mt-1">{Math.floor(record.working_minutes/60)}h {record.working_minutes%60}m</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.check_in_distance ? (
                                            <div>
                                                <span className={`font-medium ${record.check_in_distance > record.geofence_radius ? 'text-error-500 dark:text-error-400' : 'text-success-600 dark:text-success-500'}`}>
                                                    {record.check_in_distance}m
                                                    <span className="text-xs text-gray-400 dark:text-gray-500 block">(Max: {record.geofence_radius}m)</span>
                                                </span>
                                                {record.check_in_lat && record.site_lat && (
                                                    <a 
                                                        href={`https://www.google.com/maps/dir/?api=1&origin=${record.check_in_lat},${record.check_in_lng}&destination=${record.site_lat},${record.site_lng}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[10px] text-blue-light-500 dark:text-blue-light-400 hover:underline mt-1 block flex items-center"
                                                    >
                                                        <MapPin className="w-3 h-3 mr-0.5" /> Map View
                                                    </a>
                                                )}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                                            record.status === 'PRESENT' || record.status === 'WORKING' ? 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400 border-success-200 dark:border-success-800' :
                                            record.status === 'HALF_DAY' ? 'bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-400 border-warning-200 dark:border-warning-800' :
                                            'bg-error-50 dark:bg-error-500/10 text-red-700 border-error-200 dark:border-error-800'
                                        }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Grid View */}
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50">
                    {filteredRecords.map(record => (
                        <div key={record.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-theme-xs border border-gray-200 dark:border-gray-800 flex flex-col space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white/90 leading-tight">{record.emp_name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{record.emp_code}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                    record.status === 'PRESENT' || record.status === 'WORKING' ? 'bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-success-400' :
                                    record.status === 'HALF_DAY' ? 'bg-amber-100 text-warning-700 dark:text-warning-400' :
                                    'bg-error-100 dark:bg-error-500/20 text-red-700'
                                }`}>
                                    {record.status}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                <div className="col-span-2">
                                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Site / Team</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300 block truncate">{record.site_name || 'No Site'} - {record.team_name || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Check In</span>
                                    <span className="font-medium text-brand-500">
                                        {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                    </span>
                                    {record.check_in_distance && (
                                        <span className={`text-[10px] block mt-0.5 ${record.check_in_distance > record.geofence_radius ? 'text-error-500 dark:text-error-400' : 'text-success-600 dark:text-success-500'}`}>
                                            Dist: {record.check_in_distance}m
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Check Out</span>
                                    <span className="font-medium text-brand-500">
                                        {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                    </span>
                                    {record.working_minutes > 0 && (
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-0.5">
                                            {Math.floor(record.working_minutes/60)}h {record.working_minutes%60}m
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredRecords.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-400 dark:text-gray-500 text-sm">No records found for this date.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAttendanceList;
