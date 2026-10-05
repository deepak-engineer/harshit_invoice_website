import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, ShieldOff, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        is_super_admin: false
    });

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const res = await api.get('/superadmin/admins');
            setAdmins(res.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to fetch admins');
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await api.put(`/superadmin/admins/${id}/toggle`, { is_active: currentStatus ? 0 : 1 });
            toast.success(`Admin ${currentStatus ? 'blocked' : 'unblocked'} successfully`);
            fetchAdmins();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to toggle status');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentAdmin) {
                // Currently only password update is supported for existing admins by Super Admin
                if (formData.password) {
                    await api.put(`/superadmin/admins/${currentAdmin.id}/password`, { password: formData.password });
                    toast.success('Admin password updated successfully');
                } else {
                    toast.error('Password is required to update');
                    return;
                }
            } else {
                await api.post('/superadmin/admins', {
                    username: formData.username,
                    password: formData.password,
                    is_super_admin: formData.is_super_admin ? 1 : 0
                });
                toast.success('Admin added successfully');
            }
            setIsModalOpen(false);
            fetchAdmins();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save admin');
        }
    };

    const openModal = (admin = null) => {
        if (admin) {
            setCurrentAdmin(admin);
            setFormData({
                username: admin.username,
                password: admin.plain_password || '',
                is_super_admin: admin.is_super_admin == 1
            });
        } else {
            setCurrentAdmin(null);
            setFormData({ username: '', password: '', is_super_admin: false });
        }
        setIsModalOpen(true);
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage system administrators and their passwords</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Admin</span>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Password</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {admins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 dark:text-white">{admin.username}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {admin.is_super_admin == 1 ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-400">
                                                Super Admin
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                                Admin
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {admin.plain_password || '********'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {admin.is_active == 1 ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400">
                                                Blocked
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => openModal(admin)}
                                                className="p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                                                title="Edit Password"
                                            >
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(admin.id, admin.is_active == 1)}
                                                className={`p-2 transition-colors ${admin.is_active == 1 ? 'text-gray-400 hover:text-error-600 dark:hover:text-error-400' : 'text-error-500 hover:text-success-600 dark:hover:text-success-400'}`}
                                                title={admin.is_active == 1 ? 'Block Admin' : 'Unblock Admin'}
                                            >
                                                {admin.is_active == 1 ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {currentAdmin ? 'Change Password' : 'Add New Admin'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    disabled={!!currentAdmin}
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            
                            {!currentAdmin && (
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="is_super"
                                        checked={formData.is_super_admin}
                                        onChange={(e) => setFormData({ ...formData, is_super_admin: e.target.checked })}
                                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    <label htmlFor="is_super" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Is Super Admin
                                    </label>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
                                >
                                    {currentAdmin ? 'Update Password' : 'Add Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
