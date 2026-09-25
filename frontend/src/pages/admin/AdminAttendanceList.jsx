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
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <input 
                        type="text" 
                        placeholder="Search Employee..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                    <input 
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                    <select
                        value={filterState}
                        onChange={(e) => setFilterState(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white min-w-[140px]"
                    >
                        <option value="ALL">All States</option>
                        {uniqueStates.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                    <button onClick={fetchRecords} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200">
                        <Filter className="w-5 h-5 text-slate-600" />
                    </button>
                    <button onClick={exportCSV} className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
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
                        <tbody className="divide-y divide-slate-100">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-slate-400">No records found for this date.</td>
                                </tr>
                            ) : filteredRecords.map(record => (
                                <tr key={record.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800">{record.emp_name}</p>
                                        <p className="text-xs text-slate-500">{record.emp_code}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-700">{record.team_name || 'N/A'}</p>
                                        <p className="text-xs text-slate-500">{record.state || 'N/A'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-700">{record.site_name || 'No Site'}</p>
                                        <p className="text-xs text-slate-500">{record.site_code}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.check_in_time ? (
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <span>{new Date(record.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.check_out_time ? (
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <span>{new Date(record.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        ) : '-'}
                                        {record.working_minutes > 0 && (
                                            <p className="text-xs text-primary mt-1">{Math.floor(record.working_minutes/60)}h {record.working_minutes%60}m</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.check_in_distance ? (
                                            <div>
                                                <span className={`font-medium ${record.check_in_distance > record.geofence_radius ? 'text-red-500' : 'text-green-600'}`}>
                                                    {record.check_in_distance}m
                                                    <span className="text-xs text-slate-400 block">(Max: {record.geofence_radius}m)</span>
                                                </span>
                                                {record.check_in_lat && record.site_lat && (
                                                    <a 
                                                        href={`https://www.google.com/maps/dir/?api=1&origin=${record.check_in_lat},${record.check_in_lng}&destination=${record.site_lat},${record.site_lng}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[10px] text-blue-500 hover:underline mt-1 block flex items-center"
                                                    >
                                                        <MapPin className="w-3 h-3 mr-0.5" /> Map View
                                                    </a>
                                                )}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                                            record.status === 'PRESENT' || record.status === 'WORKING' ? 'bg-green-50 text-green-700 border-green-200' :
                                            record.status === 'HALF_DAY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            'bg-red-50 text-red-700 border-red-200'
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
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50">
                    {filteredRecords.map(record => (
                        <div key={record.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-slate-800 leading-tight">{record.emp_name}</h3>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">{record.emp_code}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                    record.status === 'PRESENT' || record.status === 'WORKING' ? 'bg-green-100 text-green-700' :
                                    record.status === 'HALF_DAY' ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {record.status}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="col-span-2">
                                    <span className="text-slate-400 block mb-0.5">Site / Team</span>
                                    <span className="font-medium text-slate-700 block truncate">{record.site_name || 'No Site'} - {record.team_name || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Check In</span>
                                    <span className="font-medium text-primary">
                                        {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                    </span>
                                    {record.check_in_distance && (
                                        <span className={`text-[10px] block mt-0.5 ${record.check_in_distance > record.geofence_radius ? 'text-red-500' : 'text-green-600'}`}>
                                            Dist: {record.check_in_distance}m
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Check Out</span>
                                    <span className="font-medium text-primary">
                                        {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                    </span>
                                    {record.working_minutes > 0 && (
                                        <span className="text-[10px] text-slate-500 block mt-0.5">
                                            {Math.floor(record.working_minutes/60)}h {record.working_minutes%60}m
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredRecords.length === 0 && (
                        <div className="col-span-full text-center py-8 text-slate-400 text-sm">No records found for this date.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAttendanceList;
