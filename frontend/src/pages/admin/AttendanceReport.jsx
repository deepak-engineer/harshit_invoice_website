import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Edit3 } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { holidays2026 } from '../../utils/holidays2026';

const AttendanceReport = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reportData, setReportData] = useState({});
    const [salarySummary, setSalarySummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedState, setSelectedState] = useState('');
    const [editModal, setEditModal] = useState({ isOpen: false, record: null, dateStr: '', newStatus: '' });
    const [addModal, setAddModal] = useState({ isOpen: false, emp_id: '', dateStr: new Date().toISOString().split('T')[0], status: 'HALF_DAY' });
    const [allEmployees, setAllEmployees] = useState([]);
    
    // Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-12

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/attendance-report?month=${month.toString().padStart(2, '0')}&year=${year}`);
            setReportData(res.data.calendar || {});
            
            let summaryArray = res.data.summary || [];
            // Calculate holiday pay based on site state
            const mStr = month.toString().padStart(2, '0');
            summaryArray = summaryArray.map(emp => {
                let holDays = 0;
                if (emp.state && holidays2026[emp.state]) {
                    holidays2026[emp.state].forEach(hDate => {
                        if (hDate.startsWith(`${mStr}-`)) {
                            const day = parseInt(hDate.split('-')[1], 10);
                            const d = new Date(year, month - 1, day);
                            if (d.getDay() !== 0) { // Not Sunday
                                holDays++;
                            }
                        }
                    });
                }
                emp.holiday_days = holDays;
                emp.total_salary += (holDays * emp.daily_salary);
                return emp;
            });
            
            setSalarySummary(summaryArray);

            const empRes = await api.get('/admin/employees');
            setAllEmployees(empRes.data);
        } catch (error) {
            toast.error('Failed to load attendance report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [month, year]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const prevMonth = () => {
        setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            await api.put('/admin/attendance/update-status', {
                emp_id: editModal.record.emp_id,
                attendance_date: editModal.dateStr,
                status: editModal.newStatus
            });
            toast.success('Attendance updated successfully');
            setEditModal({ isOpen: false, record: null, dateStr: '', newStatus: '' });
            fetchReport();
        } catch (err) {
            toast.error('Failed to update attendance');
        }
    };

    const handleAddManualRecord = async (e) => {
        e.preventDefault();
        if (!addModal.emp_id) {
            toast.error("Please select an employee");
            return;
        }
        try {
            await api.put('/admin/attendance/update-status', {
                emp_id: addModal.emp_id,
                attendance_date: addModal.dateStr,
                status: addModal.status
            });
            toast.success('Attendance added successfully');
            setAddModal({ ...addModal, isOpen: false });
            fetchReport();
        } catch (err) {
            toast.error('Failed to add attendance');
        }
    };

    // Calendar Generation Logic (Monday as first day of week)
    const daysInMonth = new Date(year, month, 0).getDate();
    let firstDayOfMonth = new Date(year, month - 1, 1).getDay(); 
    // Convert JS getDay (0=Sun, 1=Mon) to (0=Mon, 1=Tue, ..., 6=Sun)
    firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate();
    
    const calendarDays = [];
    
    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        calendarDays.push({
            day: daysInPrevMonth - i,
            isCurrentMonth: false,
            monthOffset: -1
        });
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push({
            day: i,
            isCurrentMonth: true,
            monthOffset: 0
        });
    }
    
    // Next month days to complete the grid (up to 35 or 42 cells)
    const totalCells = calendarDays.length > 35 ? 42 : 35;
    let nextMonthDay = 1;
    while (calendarDays.length < totalCells) {
        calendarDays.push({
            day: nextMonthDay++,
            isCurrentMonth: false,
            monthOffset: 1
        });
    }

    const getStatusColor = (status) => {
        switch(status) {
            case 'PRESENT': return 'bg-success-100 dark:bg-success-500/20 text-success-800 dark:text-success-400 border-success-200 dark:border-success-800';
            case 'WORKING': return 'bg-blue-100 text-blue-800 border-blue-light-200 dark:border-blue-light-800';
            case 'HALF_DAY': return 'bg-amber-100 text-amber-800 border-warning-200 dark:border-warning-800';
            case 'ABSENT':
            case 'REJECTED': return 'bg-error-100 dark:bg-error-500/20 text-error-800 dark:text-error-400 border-error-200 dark:border-error-800';
            default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white/90 border-gray-200 dark:border-gray-800';
        }
    };

    const getStatusShort = (status) => {
        switch(status) {
            case 'PRESENT': return 'P';
            case 'WORKING': return 'W';
            case 'HALF_DAY': return 'HD';
            case 'ABSENT': return 'A';
            case 'REJECTED': return 'R';
            default: return '?';
        }
    };

    const isSunday = (dayObj) => {
        // If it's Monday-first, Sunday is the 7th column (index 6 in a 0-6 row)
        // We can just create a Date object and check getDay() === 0
        let m = month + dayObj.monthOffset;
        let y = year;
        if (m === 0) { m = 12; y -= 1; }
        if (m === 13) { m = 1; y += 1; }
        
        const d = new Date(y, m - 1, dayObj.day);
        return d.getDay() === 0;
    };

    const isHoliday = (dayObj) => {
        if (!selectedState || !holidays2026[selectedState]) return false;
        
        let m = month + dayObj.monthOffset;
        let y = year;
        if (m === 0) { m = 12; y -= 1; }
        if (m === 13) { m = 1; y += 1; }
        
        if (y !== 2026) return false;
        
        const dateStr = `${m.toString().padStart(2, '0')}-${dayObj.day.toString().padStart(2, '0')}`;
        return holidays2026[selectedState].includes(dateStr);
    };

    const filteredSalarySummary = debouncedSearch ? salarySummary.filter(s => s.name?.toLowerCase().includes(debouncedSearch.toLowerCase())) : salarySummary;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-theme-xs border border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-brand-500/10 text-brand-500 rounded-xl">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Attendance Report</h1>
                </div>
                
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => setAddModal({ ...addModal, isOpen: true })}
                        className="hidden md:flex items-center space-x-2 bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-500/90 transition-colors shadow-theme-xs"
                    >
                        <Edit3 className="w-4 h-4" />
                        <span>Add Record</span>
                    </button>
                    
                    <select 
                        value={selectedState} 
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50"
                    >
                        <option value="">Select State (for holidays)</option>
                        {Object.keys(holidays2026).map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                    
                    <div className="flex items-center space-x-2 border-l border-gray-200 dark:border-gray-800 pl-4">
                        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition-colors">
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 min-w-[150px] text-center">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition-colors">
                            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <input 
                    type="text" 
                    placeholder="Search Employee..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none w-full md:w-64"
                />
                <div className="md:hidden w-full flex justify-end">
                    <button 
                        onClick={() => setAddModal({ ...addModal, isOpen: true })}
                        className="flex items-center space-x-2 bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-500/90 transition-colors shadow-theme-xs w-full justify-center"
                    >
                        <Edit3 className="w-4 h-4" />
                        <span>Add Manual Record</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-theme-xs border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <div className="min-w-[800px]">
                                {/* Days of Week Header */}
                        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <div key={day} className="py-3 text-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>
                        
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 auto-rows-[minmax(120px,_1fr)]">
                            {calendarDays.map((dayObj, index) => {
                                let m = month + dayObj.monthOffset;
                                let y = year;
                                if (m === 0) { m = 12; y -= 1; }
                                if (m === 13) { m = 1; y += 1; }
                                
                                const dateStr = `${y}-${m.toString().padStart(2, '0')}-${dayObj.day.toString().padStart(2, '0')}`;
                                let dayRecords = dayObj.isCurrentMonth ? (reportData[dateStr] || []) : [];
                                
                                if (debouncedSearch) {
                                    dayRecords = dayRecords.filter(r => r.name?.toLowerCase().includes(debouncedSearch.toLowerCase()));
                                }
                                
                                const isSun = isSunday(dayObj);
                                const isHol = isHoliday(dayObj);
                                const isOff = isSun || isHol;
                                
                                const isToday = new Date().toDateString() === new Date(y, m-1, dayObj.day).toDateString();
                                
                                return (
                                    <div key={index} className={`border-b border-r border-gray-100 dark:border-gray-800 p-2 flex flex-col hover:bg-gray-50 dark:bg-gray-800/50 transition-colors relative group ${!dayObj.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/50/50' : isOff ? 'bg-gray-50 dark:bg-gray-800/50/70' : 'bg-white dark:bg-gray-900'}`}>
                                        <div className="flex justify-start items-center space-x-2 mb-2">
                                            <span className={`text-sm font-semibold flex-shrink-0 ${isToday ? 'bg-brand-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : (isSun ? 'text-error-500 dark:text-error-400' : (!dayObj.isCurrentMonth ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'))}`}>
                                                {dayObj.day}
                                            </span>
                                            {isHol && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded flex-shrink-0">HOLIDAY</span>}
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                            {dayRecords.map((record, i) => (
                                                <div 
                                                    key={i} 
                                                    onClick={() => setEditModal({ isOpen: true, record, dateStr, newStatus: record.status })}
                                                    className={`text-xs px-1.5 py-1 rounded border flex items-center truncate cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(record.status)}`}
                                                    title={`Click to edit ${record.name} - ${record.status}`}
                                                >
                                                    <span className="font-bold mr-1 shrink-0">[{getStatusShort(record.status)}]</span>
                                                    <span className="truncate">{record.name}</span>
                                                </div>
                                            ))}
                                            {dayRecords.length === 0 && dayObj.isCurrentMonth && !isOff && (
                                                <div className="text-xs text-gray-400 dark:text-gray-500 italic text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    No records
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Salary Calculation Summary */}
                    {salarySummary.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-theme-xs border border-gray-100 dark:border-gray-800 overflow-hidden mt-6">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
                                    Salary Summary - {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h3>
                            </div>
                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                                    <thead className="bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-800">
                                        <tr>
                                            <th className="px-6 py-4">Employee</th>
                                            <th className="px-6 py-4 text-center">Daily Salary</th>
                                            <th className="px-6 py-4 text-center text-success-600 dark:text-success-500">Full Days</th>
                                            <th className="px-6 py-4 text-center text-amber-600">Half Days</th>
                                            <th className="px-6 py-4 text-center text-blue-light-600 dark:text-blue-light-500">Paid Holidays</th>
                                            <th className="px-6 py-4 text-center text-error-600 dark:text-error-500">Absent</th>
                                            <th className="px-6 py-4 text-right font-bold">Total Earned</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {filteredSalarySummary.map((sum) => (
                                            <tr key={sum.id} className="hover:bg-gray-50 dark:bg-gray-800/50">
                                                <td className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">{sum.name}</td>
                                                <td className="px-6 py-4 text-center">₹{sum.daily_salary.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-center font-medium text-success-700 dark:text-success-400">{sum.present_days}</td>
                                                <td className="px-6 py-4 text-center font-medium text-warning-700 dark:text-warning-400">{sum.half_days}</td>
                                                <td className="px-6 py-4 text-center font-medium text-blue-light-700 dark:text-blue-light-400">{sum.holiday_days}</td>
                                                <td className="px-6 py-4 text-center font-medium text-red-700">{sum.absent_days}</td>
                                                <td className="px-6 py-4 text-right font-bold text-brand-500 text-base">₹{sum.total_salary.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Grid View */}
                            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50">
                                {filteredSalarySummary.map(sum => (
                                    <div key={sum.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-xs flex flex-col">
                                        <h4 className="font-bold text-gray-800 dark:text-white/90 text-lg mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">{sum.name}</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                            <div><span className="text-gray-400 dark:text-gray-500 text-xs block mb-0.5">Daily Salary</span><span className="font-medium text-gray-700 dark:text-gray-300">₹{sum.daily_salary.toFixed(2)}</span></div>
                                            <div><span className="text-gray-400 dark:text-gray-500 text-xs block mb-0.5">Full Days</span><span className="font-bold text-success-600 dark:text-success-500">{sum.present_days}</span></div>
                                            <div><span className="text-gray-400 dark:text-gray-500 text-xs block mb-0.5">Half Days</span><span className="font-bold text-amber-600">{sum.half_days}</span></div>
                                            <div><span className="text-gray-400 dark:text-gray-500 text-xs block mb-0.5">Paid Holidays</span><span className="font-bold text-blue-light-600 dark:text-blue-light-500">{sum.holiday_days}</span></div>
                                            <div><span className="text-gray-400 dark:text-gray-500 text-xs block mb-0.5">Absent</span><span className="font-bold text-error-600 dark:text-error-500">{sum.absent_days}</span></div>
                                        </div>
                                        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-brand-500/5 -mx-4 -mb-4 p-4 rounded-b-xl">
                                            <span className="text-gray-600 dark:text-gray-400 font-semibold">Total Earned</span>
                                            <span className="text-brand-500 font-black text-xl">₹{sum.total_salary.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Attendance Modal */}
            {editModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-white/90 flex items-center">
                                <Edit3 className="w-5 h-5 mr-2 text-brand-500" />
                                Edit Attendance
                            </h3>
                            <button 
                                onClick={() => setEditModal({ isOpen: false, record: null, dateStr: '', newStatus: '' })}
                                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Updating attendance for <strong className="text-gray-800 dark:text-white/90">{editModal.record?.name}</strong> on <strong className="text-gray-800 dark:text-white/90">{new Date(editModal.dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>.
                            </p>
                            <form onSubmit={handleUpdateStatus} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Status</label>
                                    <select 
                                        value={editModal.newStatus} 
                                        onChange={e => setEditModal({...editModal, newStatus: e.target.value})} 
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all text-gray-800 dark:text-white/90 font-medium bg-white dark:bg-gray-900"
                                    >
                                        <option value="PRESENT">Present (Full Day)</option>
                                        <option value="WORKING">Working (Full Day)</option>
                                        <option value="HALF_DAY">Half Day</option>
                                        <option value="ABSENT">Absent</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setEditModal({ isOpen: false, record: null, dateStr: '', newStatus: '' })} 
                                        className="px-5 py-2.5 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:bg-gray-800 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-5 py-2.5 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-500/90 transition-all shadow-theme-xs hover:shadow-md"
                                    >
                                        Update Status
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Manual Attendance Modal */}
            {addModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-white/90 flex items-center">
                                <Edit3 className="w-5 h-5 mr-2 text-brand-500" />
                                Add Manual Record
                            </h3>
                            <button 
                                onClick={() => setAddModal({ ...addModal, isOpen: false })}
                                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleAddManualRecord} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Employee</label>
                                    <select 
                                        value={addModal.emp_id} 
                                        onChange={e => setAddModal({...addModal, emp_id: e.target.value})} 
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all text-gray-800 dark:text-white/90 font-medium bg-white dark:bg-gray-900"
                                    >
                                        <option value="">-- Select Employee --</option>
                                        {allEmployees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.emp_id})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={addModal.dateStr}
                                        onChange={e => setAddModal({...addModal, dateStr: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all text-gray-800 dark:text-white/90 font-medium bg-white dark:bg-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                                    <select 
                                        value={addModal.status} 
                                        onChange={e => setAddModal({...addModal, status: e.target.value})} 
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all text-gray-800 dark:text-white/90 font-medium bg-white dark:bg-gray-900"
                                    >
                                        <option value="HALF_DAY">Half Day</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setAddModal({ ...addModal, isOpen: false })} 
                                        className="px-5 py-2.5 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:bg-gray-800 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-5 py-2.5 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-500/90 transition-all shadow-theme-xs hover:shadow-md"
                                    >
                                        Save Record
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceReport;
