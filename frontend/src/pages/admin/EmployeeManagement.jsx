import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Camera, Key, UserX, CheckCircle, Trash2, X, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import FaceRegistrationModal from './FaceRegistrationModal';
import { holidays2026 } from '../../utils/holidays2026';

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [sites, setSites] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modals state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [isFaceOpen, setIsFaceOpen] = useState(false);
    const [viewingPhoto, setViewingPhoto] = useState(null);
    const [salaryModal, setSalaryModal] = useState({ isOpen: false, emp: null, isApproveMode: false });
    const [salaryInput, setSalaryInput] = useState('');
    const [teamInput, setTeamInput] = useState('');
    const [siteInput, setSiteInput] = useState('');
    const [salaryReportModal, setSalaryReportModal] = useState({ isOpen: false, emp: null, month: new Date().getMonth() + 1, year: new Date().getFullYear(), data: null, loading: false, selectedState: '' });
    
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [formData, setFormData] = useState({
        emp_id: '', name: '', phone: '', username: '', password: '', daily_salary: '', site_id: '', team_id: '', photo: '', status: 'ACTIVE', state: ''
    });
    const [newPassword, setNewPassword] = useState('');

    const fetchData = async () => {
        try {
            const [empRes, siteRes, teamRes] = await Promise.all([
                api.get('/admin/employees'),
                api.get('/admin/sites'),
                api.get('/admin/teams')
            ]);
            setEmployees(empRes.data);
            setSites(siteRes.data);
            setTeams(teamRes.data);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedEmp) {
                await api.put(`/admin/employees/${selectedEmp.id}`, formData);
                toast.success('Employee updated');
            } else {
                await api.post('/admin/employees', formData);
                toast.success('Employee created');
            }
            setIsFormOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                await api.delete(`/admin/employees/${id}`);
                toast.success('Employee deleted successfully');
                fetchData();
            } catch (error) {
                toast.error(error.response?.data?.error || 'Failed to delete employee');
            }
        }
    };

    const handleApprove = (emp) => {
        setSalaryInput(emp.daily_salary || '');
        setTeamInput(emp.team_id || '');
        setSiteInput(emp.site_id || '');
        setSalaryModal({ isOpen: true, emp, isApproveMode: true });
    };

    const handleUpdateSalary = (emp) => {
        setSalaryInput(emp.daily_salary || '');
        setTeamInput(emp.team_id || '');
        setSiteInput(emp.site_id || '');
        setSalaryModal({ isOpen: true, emp, isApproveMode: false });
    };

    const handleSaveSalary = async (e) => {
        e.preventDefault();
        const { emp, isApproveMode } = salaryModal;
        const salary = parseFloat(salaryInput);
        
        if (isNaN(salary) || salary < 0) {
            toast.error('Please enter a valid numeric salary');
            return;
        }

        try {
            const payload = { 
                ...emp, 
                daily_salary: salary,
                team_id: teamInput || null,
                site_id: siteInput || null
            };
            if (isApproveMode) payload.status = 'ACTIVE';

            await api.put(`/admin/employees/${emp.id}`, payload);
            toast.success(isApproveMode ? 'Employee approved with assignments set' : 'Assignments updated successfully');
            setSalaryModal({ isOpen: false, emp: null, isApproveMode: false });
            fetchData();
        } catch (error) {
            toast.error(isApproveMode ? 'Failed to approve employee' : 'Failed to update assignments');
        }
    };

    const openSalaryReport = (emp) => {
        const m = new Date().getMonth() + 1;
        const y = new Date().getFullYear();
        setSalaryReportModal({ isOpen: true, emp, month: m, year: y, data: null, loading: true, selectedState: '' });
        fetchSalaryReport(emp.id, m, y);
    };

    const fetchSalaryReport = async (empId, month, year, overrideState = null) => {
        try {
            const res = await api.get(`/admin/employees/${empId}/salary-report?month=${month.toString().padStart(2, '0')}&year=${year}`);
            
            let data = res.data;
            const mStr = month.toString().padStart(2, '0');
            let holDays = 0;
            
            const stateToUse = overrideState !== null ? overrideState : (data.state || '');
            
            if (stateToUse && holidays2026[stateToUse]) {
                holidays2026[stateToUse].forEach(hDate => {
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
            data.base_total_salary = data.total_salary; // Track base salary
            data.total_salary += (holDays * data.daily_salary);
            
            setSalaryReportModal(prev => ({ ...prev, data, loading: false, selectedState: stateToUse }));
        } catch(err) {
            toast.error('Failed to load salary report');
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
            fetchSalaryReport(prev.emp.id, m, y, prev.selectedState);
            return { ...prev, month: m, year: y, loading: true };
        });
    };

    const handleReportStateChange = (e) => {
        const newState = e.target.value;
        const month = salaryReportModal.month;
        const year = salaryReportModal.year;
        
        if (!salaryReportModal.data) return;
        
        let data = { ...salaryReportModal.data };
        const mStr = month.toString().padStart(2, '0');
        let holDays = 0;
        
        if (newState && holidays2026[newState]) {
            holidays2026[newState].forEach(hDate => {
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
        data.total_salary = data.base_total_salary + (holDays * data.daily_salary);
        
        setSalaryReportModal(prev => ({ ...prev, data, selectedState: newState }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/admin/employees/${selectedEmp.id}/reset-password`, { password: newPassword });
            toast.success('Password reset successfully');
            setIsPasswordOpen(false);
        } catch (error) {
            toast.error('Failed to reset password');
        }
    };

    const openNew = () => {
        setFormData({ emp_id: '', name: '', phone: '', username: '', password: '', daily_salary: '', site_id: '', team_id: '', photo: '', status: 'ACTIVE', state: '' });
        setSelectedEmp(null);
        setIsFormOpen(true);
    };

    const openEdit = (emp) => {
        setFormData({ ...emp, password: '', photo: '' }); // Don't reload photo in form to prevent massive base64 payload unless changed
        setSelectedEmp(emp);
        setIsFormOpen(true);
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const openPassword = (emp) => {
        setSelectedEmp(emp);
        setNewPassword('');
        setIsPasswordOpen(true);
    };

    const openFace = (emp) => {
        setSelectedEmp(emp);
        setIsFaceOpen(true);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
                <button onClick={openNew} className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                    <Plus className="w-5 h-5" />
                    <span>Add Employee</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Photo</th>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Phone</th>
                            <th className="px-6 py-4">Username</th>
                            <th className="px-6 py-4">Assigned Team</th>
                            <th className="px-6 py-4">Assigned Site</th>
                            <th className="px-6 py-4">Salary/Day</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {employees.map(emp => (
                            <tr key={emp.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono text-xs">{emp.emp_id}</td>
                                <td className="px-6 py-4">
                                    {emp.photo ? (
                                        <button 
                                            onClick={() => setViewingPhoto(`${api.defaults.baseURL.replace(/\/api$/, '')}/uploads/employees/${emp.photo}`)}
                                            className="focus:outline-none hover:opacity-80 transition-opacity rounded-md shadow-sm ring-2 ring-transparent hover:ring-primary/50 overflow-hidden block"
                                            title="View enlarged photo"
                                        >
                                            <img src={`${api.defaults.baseURL.replace(/\/api$/, '')}/uploads/employees/${emp.photo}`} alt="Profile" className="w-16 h-20 object-cover border border-slate-200" />
                                        </button>
                                    ) : (
                                        <div className="w-16 h-20 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                            <Camera className="w-6 h-6" />
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-800">{emp.name}</td>
                                <td className="px-6 py-4">{emp.phone || '-'}</td>
                                <td className="px-6 py-4">{emp.username}</td>
                                <td className="px-6 py-4 text-xs">
                                    <div className="flex items-center space-x-2">
                                        <span>{emp.team_id ? teams.find(t => t.id === emp.team_id)?.name || 'Unknown' : <span className="text-slate-400 italic">None</span>}</span>
                                        <button onClick={() => handleUpdateSalary(emp)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Quick Edit Assignments">
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs">
                                    <div className="flex items-center space-x-2">
                                        <span>{emp.site_id ? sites.find(s => s.id === emp.site_id)?.code || 'Unknown' : <span className="text-slate-400 italic">None</span>}</span>
                                        <button onClick={() => handleUpdateSalary(emp)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Quick Edit Assignments">
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        <span>₹{emp.daily_salary}</span>
                                        <button onClick={() => handleUpdateSalary(emp)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Quick Edit Assignments">
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : emp.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                        {emp.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex space-x-3">
                                        {emp.status === 'PENDING' && (
                                            <button onClick={() => handleApprove(emp)} className="text-green-600 hover:text-green-800" title="Approve Employee">
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button onClick={() => openEdit(emp)} className="text-blue-600 hover:text-blue-800" title="Edit Profile">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => openSalaryReport(emp)} className="text-green-600 hover:text-green-800" title="Employee Salary Report">
                                            <Wallet className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => openPassword(emp)} className="text-amber-600 hover:text-amber-800" title="Reset Password">
                                            <Key className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => openFace(emp)} className="text-purple-600 hover:text-purple-800" title="Register Face">
                                            <Camera className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:text-red-800" title="Delete/Reject Employee">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">{selectedEmp ? 'Edit Employee' : 'New Employee'}</h2>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                                    <input type="text" required value={formData.emp_id} onChange={e => setFormData({...formData, emp_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">State (For Holidays)</label>
                                    <select value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                                        <option value="">-- Default (From Site) --</option>
                                        {Object.keys(holidays2026).map(st => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                    <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {!selectedEmp && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                        <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Daily Salary (₹)</label>
                                    <input type="number" step="0.01" required value={formData.daily_salary} onChange={e => setFormData({...formData, daily_salary: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Site</label>
                                    <select value={formData.site_id} onChange={e => setFormData({...formData, site_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                                        <option value="">-- None --</option>
                                        {sites.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Team</label>
                                    <select value={formData.team_id} onChange={e => setFormData({...formData, team_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                                        <option value="">-- None --</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="INACTIVE">INACTIVE</option>
                                        <option value="PENDING">PENDING</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Profile Photo</label>
                                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                                    {formData.photo && (
                                        <div className="mt-2">
                                            <img src={formData.photo} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Save Employee</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {isPasswordOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Reset Password</h2>
                        <p className="text-sm text-slate-500 mb-4">For {selectedEmp.name}</p>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                <input type="text" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setIsPasswordOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">Reset</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Face Registration Modal */}
            {isFaceOpen && selectedEmp && (
                <FaceRegistrationModal 
                    employee={selectedEmp} 
                    onClose={() => setIsFaceOpen(false)} 
                    onComplete={() => { setIsFaceOpen(false); fetchData(); }} 
                />
            )}

            {/* Custom Assignments Modal */}
            {salaryModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all border border-slate-100">
                        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">
                                {salaryModal.isApproveMode ? 'Approve Employee' : 'Update Assignments'}
                            </h3>
                            <button 
                                onClick={() => setSalaryModal({ isOpen: false, emp: null, isApproveMode: false })}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-600 mb-4">
                                {salaryModal.isApproveMode 
                                    ? `Please set the initial details for ${salaryModal.emp?.name} before approving.` 
                                    : `Update assignments for ${salaryModal.emp?.name}.`}
                            </p>
                            <form onSubmit={handleSaveSalary} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Daily Salary (₹)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-slate-500 font-medium">₹</span>
                                        </div>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            required
                                            autoFocus
                                            value={salaryInput} 
                                            onChange={e => setSalaryInput(e.target.value)} 
                                            className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-medium text-slate-800" 
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Team</label>
                                    <select 
                                        value={teamInput} 
                                        onChange={e => setTeamInput(e.target.value)} 
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-800"
                                    >
                                        <option value="">-- No Team --</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Site</label>
                                    <select 
                                        value={siteInput} 
                                        onChange={e => setSiteInput(e.target.value)} 
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-800"
                                    >
                                        <option value="">-- No Site --</option>
                                        {sites.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                                    </select>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setSalaryModal({ isOpen: false, emp: null, isApproveMode: false })} 
                                        className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-5 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                                    >
                                        {salaryModal.isApproveMode ? 'Approve' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Viewer Modal */}
            {viewingPhoto && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
                    onClick={() => setViewingPhoto(null)}
                >
                    <button 
                        className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-all"
                        onClick={() => setViewingPhoto(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div 
                        className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={viewingPhoto} 
                            alt="Enlarged Profile" 
                            className="w-auto h-auto max-w-full max-h-[90vh] object-contain"
                        />
                    </div>
                </div>
            )}

            {/* Individual Employee Salary Report Modal */}
            {salaryReportModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <Wallet className="w-5 h-5 mr-2 text-primary" />
                                Salary Report: {salaryReportModal.emp?.name}
                            </h3>
                            <button 
                                onClick={() => setSalaryReportModal({ isOpen: false, emp: null, data: null })}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                            <button onClick={() => changeReportMonth('prev')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex space-x-4 items-center">
                                <h4 className="font-bold text-slate-700 bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-100">
                                    {new Date(salaryReportModal.year, salaryReportModal.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h4>
                                <select 
                                    value={salaryReportModal.selectedState} 
                                    onChange={handleReportStateChange}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="">No State (No Holidays)</option>
                                    {Object.keys(holidays2026).map(st => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                            </div>
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

export default EmployeeManagement;
