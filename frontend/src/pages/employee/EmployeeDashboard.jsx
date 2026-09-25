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

    const handleUpdateStatus = async () => {
        setUpdating(true);
        try {
            await api.post('/me/site-status', {
                status: siteStatus,
                requirements: siteStatus === 'Requirements' ? requirements : ''
            });
            alert('Site status updated successfully!');
            fetchStats();
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
                <h1 className="text-2xl font-bold text-slate-800">Welcome, {employee.name}</h1>
                <button 
                    onClick={openSalaryReport} 
                    className="flex items-center justify-center space-x-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                >
                    <Wallet className="w-5 h-5" />
                    <span>My Salary Report</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Today's Status</p>
                        <h3 className="text-xl font-bold text-slate-800">
                            {today ? today.status : 'Not Checked In'}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <IndianRupee className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Daily Salary</p>
                        <h3 className="text-xl font-bold text-slate-800">₹{employee.daily_salary}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Check In Time</p>
                        <h3 className="text-xl font-bold text-slate-800">
                            {today?.check_in_time ? new Date(today.check_in_time).toLocaleTimeString() : '--:--'}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Assigned Site</h2>
                {employee.site ? (
                    <div>
                        <div className="mb-4">
                            <p className="font-medium text-slate-700 text-lg">{employee.site.name}</p>
                            <p className="text-sm font-semibold text-primary mb-1">Branch Code: {employee.site.code}</p>
                            <p className="text-sm text-slate-500">{employee.site.address}</p>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-700 mb-3">Report Site Status</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                                    <select 
                                        value={siteStatus} 
                                        onChange={(e) => setSiteStatus(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    >
                                        <option value="N/A">N/A</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Panel Fault">Panel Fault</option>
                                        <option value="Requirements">Requirements</option>
                                    </select>
                                </div>
                                
                                {siteStatus === 'Requirements' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Requirements Details</label>
                                        <textarea 
                                            value={requirements}
                                            onChange={(e) => setRequirements(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            rows="3"
                                            placeholder="Type your requirements here..."
                                        ></textarea>
                                    </div>
                                )}
                                
                                <div className="flex space-x-3">
                                    <button 
                                        onClick={handleUpdateStatus}
                                        disabled={updating}
                                        className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        {updating ? 'Updating...' : 'Update Status'}
                                    </button>
                                    
                                    {today && today.status === 'WORKING' && (
                                        <button 
                                            onClick={() => window.location.href = '/employee/work'}
                                            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                                        >
                                            Go to Site Work
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">No site assigned yet.</p>
                )}
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Assigned Team</h2>
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
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6">
                 <h2 className="text-lg font-bold text-slate-800 mb-4">Profile Status</h2>
                 <div className="flex items-center space-x-2">
                     <CheckCircle className={`w-5 h-5 ${employee.face_registered ? 'text-green-500' : 'text-slate-300'}`} />
                     <span className={employee.face_registered ? 'text-slate-700' : 'text-slate-500'}>
                         Face Registration: {employee.face_registered ? 'Completed' : 'Pending'}
                     </span>
                 </div>
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
