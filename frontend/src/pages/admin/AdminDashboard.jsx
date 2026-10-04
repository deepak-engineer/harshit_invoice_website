import React, { useEffect, useState } from 'react';
import { Users, UserCheck, Briefcase, MapPin } from 'lucide-react';
import api from '../../utils/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        total_employees: 0,
        present_today: 0,
        working_now: 0,
        live_attendance: []
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/dashboard');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Admin Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
                {/* Total Employees */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                        <Users className="size-6 text-gray-800 dark:text-white/90" />
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                        <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Total Employees</span>
                            <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{stats.total_employees}</h4>
                        </div>
                    </div>
                </div>
                
                {/* Present Today */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                        <UserCheck className="size-6 text-gray-800 dark:text-white/90" />
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                        <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Present Today</span>
                            <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{stats.present_today}</h4>
                        </div>
                    </div>
                </div>

                {/* Working Now */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                        <Briefcase className="size-6 text-gray-800 dark:text-white/90" />
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                        <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Working Now</span>
                            <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{stats.working_now}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Attendance */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6 dark:border-gray-800 dark:bg-white/3">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Live Attendance Today
                        </h3>
                    </div>
                </div>

                <div className="w-full">
                    <table className="w-full">
                        <thead className="border-y border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="py-2 md:py-3 text-start text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 px-1 md:px-2">Employee</th>
                                <th className="py-2 md:py-3 text-start text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 px-1 md:px-2">Site</th>
                                <th className="py-2 md:py-3 text-start text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 px-1 md:px-2">Check In</th>
                                <th className="py-2 md:py-3 text-start text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 px-1 md:px-2 hidden sm:table-cell">Check Out</th>
                                <th className="py-2 md:py-3 text-start text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 px-1 md:px-2 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {stats.live_attendance.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No attendance recorded today
                                    </td>
                                </tr>
                            ) : (
                                stats.live_attendance.map((record) => (
                                    <tr key={record.id}>
                                        <td className="py-2 md:py-3 px-1 md:px-2 text-[10px] md:text-sm font-medium text-gray-800 dark:text-white/90 truncate max-w-[80px] md:max-w-none">{record.emp_name}</td>
                                        <td className="py-2 md:py-3 px-1 md:px-2 text-[10px] md:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[60px] md:max-w-none">{record.site_name || 'N/A'}</td>
                                        <td className="py-2 md:py-3 px-1 md:px-2 text-[10px] md:text-sm text-gray-500 dark:text-gray-400">{new Date(record.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td className="py-2 md:py-3 px-1 md:px-2 text-[10px] md:text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                                            {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                        </td>
                                        <td className="py-2 md:py-3 px-1 md:px-2 text-right">
                                            {record.status === 'WORKING' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/20">
                                                    Working
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20">
                                                    {record.status}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
