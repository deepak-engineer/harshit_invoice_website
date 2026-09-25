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
    
    // Assignment Search states
    const [siteSearch, setSiteSearch] = useState('');
    const [teamSearch, setTeamSearch] = useState('');

    // Search and bulk delete states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [formData, setFormData] = useState({
        emp_id: '', name: '', phone: '', username: '', password: '', daily_salary: '', site_id: '', team_id: '', photo: '', status: 'ACTIVE', state: ''
    });
    const [newSiteData, setNewSiteData] = useState({ name: '', code: '', address: '', state: '', status: 'ACTIVE' });
    const [newTeamData, setNewTeamData] = useState({ name: '', site_id: '', state: '' });
    const [submittingForm, setSubmittingForm] = useState(false);
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

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (!debouncedSearch) {
            setFilteredEmployees(employees);
        } else {
            const lowerSearch = debouncedSearch.toLowerCase();
            setFilteredEmployees(employees.filter(emp => 
                (emp.emp_id && emp.emp_id.toLowerCase().includes(lowerSearch)) ||
                (emp.name && emp.name.toLowerCase().includes(lowerSearch))
            ));
        }
    }, [debouncedSearch, employees]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredEmployees.map(emp => emp.id));
        } else {
            setSelectedIds([]);
        }
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
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} employees?`)) {
            try {
                await api.post('/admin/employees/bulk-delete', { ids: selectedIds });
                toast.success('Employees deleted successfully');
                setSelectedIds([]);
                fetchData();
            } catch (error) {
                toast.error(error.response?.data?.error || 'Failed to delete employees');
            }
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmittingForm(true);
        try {
            let finalSiteId = formData.site_id;
            let finalTeamId = formData.team_id;

            if (finalSiteId === 'NEW_SITE') {
                const siteRes = await api.post('/admin/sites', newSiteData);
                finalSiteId = siteRes.data.id;
            }

            if (finalTeamId === 'NEW_TEAM') {
                const teamPayload = { ...newTeamData };
                if (teamPayload.site_id === 'NEW_SITE') {
                    teamPayload.site_id = finalSiteId; // link to newly created site if applicable
                }
                const teamRes = await api.post('/admin/teams', teamPayload);
                finalTeamId = teamRes.data.id;
            }

            const payload = { 
                ...formData, 
                name: `${formData.first_name || ''} ${formData.last_name || ''}`.trim(),
                site_id: finalSiteId === 'NEW_SITE' || !finalSiteId ? '' : finalSiteId, 
                team_id: finalTeamId === 'NEW_TEAM' || !finalTeamId ? '' : finalTeamId 
            };

            if (selectedEmp) {
                await api.put(`/admin/employees/${selectedEmp.id}`, payload);
                toast.success('Employee updated');
            } else {
                await api.post('/admin/employees', payload);
                toast.success('Employee created');
            }
            setIsFormOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        } finally {
            setSubmittingForm(false);
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
        setFormData({ emp_id: '', first_name: '', last_name: '', phone: '', username: '', password: '', daily_salary: '', site_id: '', team_id: '', photo: '', status: 'ACTIVE', state: '' });
        setNewSiteData({ name: '', code: '', address: '', state: '', status: 'ACTIVE' });
        setNewTeamData({ name: '', site_id: '', state: '' });
        setSelectedEmp(null);
        setIsFormOpen(true);
    };

    const openEdit = (emp) => {
        const [firstName, ...rest] = (emp.name || '').split(' ');
        const lastName = rest.join(' ');
        setFormData({ ...emp, first_name: firstName, last_name: lastName, password: '' }); // Don't clear photo, backend ignores if not base64
        setNewSiteData({ name: '', code: '', address: '', state: '', status: 'ACTIVE' });
        setNewTeamData({ name: '', site_id: '', state: '' });
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

    const filteredSitesOptions = sites.filter(s => 
        (s.code && s.code.toLowerCase().includes(siteSearch.toLowerCase())) || 
        (s.name && s.name.toLowerCase().includes(siteSearch.toLowerCase()))
    );

    const filteredTeamsOptions = teams.filter(t => 
        (t.name && t.name.toLowerCase().includes(teamSearch.toLowerCase()))
    );

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Employee Management</h1>
                <div className="flex space-x-3 items-center w-full sm:w-auto">
                    <input 
                        type="text" 
                        placeholder="Search by ID or Name..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm w-full sm:w-64"
                    />
                    {selectedIds.length > 0 && (
                        <button onClick={handleBulkDelete} className="flex items-center space-x-2 bg-error-50 dark:bg-error-500/10 text-error-600 dark:text-error-500 border border-error-200 dark:border-error-800 px-4 py-2 rounded-lg hover:bg-error-100 dark:bg-error-500/20 transition-colors whitespace-nowrap">
                            <Trash2 className="w-5 h-5" />
                            <span className="hidden sm:inline">Delete ({selectedIds.length})</span>
                        </button>
                    )}
                    <button onClick={openNew} className="flex items-center space-x-2 bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-500/90 transition-colors whitespace-nowrap">
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Add Employee</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-theme-xs border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-brand-500 focus:ring-brand-500 cursor-pointer"
                                        checked={filteredEmployees.length > 0 && selectedIds.length === filteredEmployees.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
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
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredEmployees.map(emp => (
                                <tr key={emp.id} className={`hover:bg-gray-50 dark:bg-gray-800/50 ${selectedIds.includes(emp.id) ? 'bg-brand-500/5' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-brand-500 focus:ring-brand-500 cursor-pointer"
                                            checked={selectedIds.includes(emp.id)}
                                            onChange={() => handleSelect(emp.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{emp.emp_id}</td>
                                    <td className="px-6 py-4">
                                        {emp.photo ? (
                                            <button 
                                                onClick={() => setViewingPhoto(`${api.defaults.baseURL.replace(/\/api$/, '')}/uploads/employees/${emp.photo}`)}
                                                className="focus:outline-none hover:opacity-80 transition-opacity rounded-md shadow-theme-xs ring-2 ring-transparent hover:ring-brand-500/50 overflow-hidden block"
                                                title="View enlarged photo"
                                            >
                                                <img src={`${api.defaults.baseURL.replace(/\/api$/, '')}/uploads/employees/${emp.photo}`} alt="Profile" className="w-16 h-20 object-cover border border-gray-200 dark:border-gray-800" />
                                            </button>
                                        ) : (
                                            <div className="w-16 h-20 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-800">
                                                <Camera className="w-6 h-6" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">{emp.name}</td>
                                    <td className="px-6 py-4">{emp.phone || '-'}</td>
                                    <td className="px-6 py-4">{emp.username}</td>
                                    <td className="px-6 py-4 text-xs">
                                        <div className="flex items-center space-x-2">
                                            <span>{emp.team_id ? teams.find(t => t.id === emp.team_id)?.name || 'Unknown' : <span className="text-gray-400 dark:text-gray-500 italic">None</span>}</span>
                                            <button onClick={() => handleUpdateSalary(emp)} className="text-gray-400 dark:text-gray-500 hover:text-blue-light-600 dark:text-blue-light-500 transition-colors" title="Quick Edit Assignments">
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        <div className="flex items-center space-x-2">
                                            <span>{emp.site_id ? sites.find(s => s.id === emp.site_id)?.code || 'Unknown' : <span className="text-gray-400 dark:text-gray-500 italic">None</span>}</span>
                                            <button onClick={() => handleUpdateSalary(emp)} className="text-gray-400 dark:text-gray-500 hover:text-blue-light-600 dark:text-blue-light-500 transition-colors" title="Quick Edit Assignments">
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <span>₹{emp.daily_salary}</span>
                                            <button onClick={() => handleUpdateSalary(emp)} className="text-gray-400 dark:text-gray-500 hover:text-blue-light-600 dark:text-blue-light-500 transition-colors" title="Quick Edit Assignments">
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.status === 'ACTIVE' ? 'bg-success-100 dark:bg-success-500/20 text-success-800 dark:text-success-400' : emp.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-error-100 dark:bg-error-500/20 text-error-800 dark:text-error-400'}`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-3">
                                            {emp.status === 'PENDING' && (
                                                <button onClick={() => handleApprove(emp)} className="text-success-600 dark:text-success-500 hover:text-success-800 dark:text-success-400" title="Approve Employee">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => openEdit(emp)} className="text-blue-light-600 dark:text-blue-light-500 hover:text-blue-light-700 dark:hover:text-blue-light-400" title="Edit Profile">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => openSalaryReport(emp)} className="text-success-600 dark:text-success-500 hover:text-success-800 dark:text-success-400" title="Employee Salary Report">
                                                <Wallet className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => openPassword(emp)} className="text-amber-600 hover:text-amber-800" title="Reset Password">
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => openFace(emp)} className="text-purple-600 hover:text-purple-800" title="Register Face">
                                                <Camera className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(emp.id)} className="text-error-600 dark:text-error-500 hover:text-error-800 dark:text-error-400" title="Delete/Reject Employee">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Grid View */}
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50">
                    {filteredEmployees.map(emp => (
                        <div key={emp.id} className={`bg-white dark:bg-gray-900 p-4 rounded-xl shadow-theme-xs border ${selectedIds.includes(emp.id) ? 'border-brand-500 ring-1 ring-brand-500' : 'border-gray-200 dark:border-gray-800'} flex flex-col space-y-4`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-3">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-brand-500 focus:ring-brand-500 cursor-pointer mt-1"
                                        checked={selectedIds.includes(emp.id)}
                                        onChange={() => handleSelect(emp.id)}
                                    />
                                    {emp.photo ? (
                                        <button 
                                            onClick={() => setViewingPhoto(`${api.defaults.baseURL.replace(/\/api$/, '')}/uploads/employees/${emp.photo}`)}
                                            className="focus:outline-none rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 shrink-0"
                                        >
                                            <img src={`${api.defaults.baseURL.replace(/\/api$/, '')}/uploads/employees/${emp.photo}`} alt="Profile" className="w-12 h-12 object-cover" />
                                        </button>
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-800 shrink-0">
                                            <Camera className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-gray-800 dark:text-white/90 leading-tight">{emp.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{emp.emp_id} | {emp.username}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${emp.status === 'ACTIVE' ? 'bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-success-400' : emp.status === 'PENDING' ? 'bg-amber-100 text-warning-700 dark:text-warning-400' : 'bg-error-100 dark:bg-error-500/20 text-red-700'}`}>
                                    {emp.status}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                <div>
                                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Phone</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{emp.phone || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Salary/Day</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                        ₹{emp.daily_salary}
                                        <button onClick={() => handleUpdateSalary(emp)} className="ml-1 text-gray-400 dark:text-gray-500 hover:text-blue-light-600 dark:text-blue-light-500"><Edit2 className="w-3 h-3" /></button>
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Team</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                        <span className="truncate max-w-[80px] block">{emp.team_id ? teams.find(t => t.id === emp.team_id)?.name || 'Unknown' : <span className="text-gray-400 dark:text-gray-500 italic">None</span>}</span>
                                        <button onClick={() => handleUpdateSalary(emp)} className="ml-1 text-gray-400 dark:text-gray-500 hover:text-blue-light-600 dark:text-blue-light-500 shrink-0"><Edit2 className="w-3 h-3" /></button>
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Site</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                        <span className="truncate max-w-[80px] block">{emp.site_id ? sites.find(s => s.id === emp.site_id)?.code || 'Unknown' : <span className="text-gray-400 dark:text-gray-500 italic">None</span>}</span>
                                        <button onClick={() => handleUpdateSalary(emp)} className="ml-1 text-gray-400 dark:text-gray-500 hover:text-blue-light-600 dark:text-blue-light-500 shrink-0"><Edit2 className="w-3 h-3" /></button>
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2">
                                <div className="flex flex-wrap gap-2">
                                    {emp.status === 'PENDING' && (
                                        <button onClick={() => handleApprove(emp)} className="p-2 bg-success-50 dark:bg-success-500/10 hover:bg-success-100 dark:bg-success-500/20 text-success-600 dark:text-success-500 rounded-lg transition-colors border border-green-100">
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button onClick={() => openEdit(emp)} className="p-2 bg-blue-light-50 dark:bg-blue-light-500/10 hover:bg-blue-100 text-blue-light-600 dark:text-blue-light-500 rounded-lg transition-colors border border-blue-100">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => openSalaryReport(emp)} className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors border border-emerald-100">
                                        <Wallet className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => openPassword(emp)} className="p-2 bg-warning-50 dark:bg-warning-500/10 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors border border-amber-100">
                                        <Key className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => openFace(emp)} className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors border border-purple-100">
                                        <Camera className="w-4 h-4" />
                                    </button>
                                </div>
                                <button onClick={() => handleDelete(emp.id)} className="p-2 bg-error-50 dark:bg-error-500/10 hover:bg-error-100 dark:bg-error-500/20 text-error-600 dark:text-error-500 rounded-lg transition-colors border border-red-100">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredEmployees.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-400 dark:text-gray-500 text-sm">No employees found.</div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[95vh] overflow-y-auto custom-scrollbar">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-4">{selectedEmp ? 'Edit Employee' : 'New Employee'}</h2>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee ID</label>
                                    <input type="text" required value={formData.emp_id} onChange={e => setFormData({...formData, emp_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State (For Holidays)</label>
                                    <select value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
                                        <option value="">-- Default (From Site) --</option>
                                        {Object.keys(holidays2026).map(st => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                                    <input type="text" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                                    <input type="text" required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                    <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                                    <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {!selectedEmp && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                        <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Salary (₹)</label>
                                    <input type="number" step="0.01" required value={formData.daily_salary} onChange={e => setFormData({...formData, daily_salary: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Site</label>
                                    <input 
                                        type="text" 
                                        placeholder="Search site..." 
                                        value={siteSearch}
                                        onChange={e => setSiteSearch(e.target.value)}
                                        className="w-full px-3 py-1 mb-2 text-xs border rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                                    />
                                    <select value={formData.site_id} onChange={e => setFormData({...formData, site_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
                                        <option value="">-- None --</option>
                                        <option value="NEW_SITE" className="text-brand-500 font-bold">+ Add New Site</option>
                                        {filteredSitesOptions.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Team</label>
                                    <input 
                                        type="text" 
                                        placeholder="Search team..." 
                                        value={teamSearch}
                                        onChange={e => setTeamSearch(e.target.value)}
                                        className="w-full px-3 py-1 mb-2 text-xs border rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                                    />
                                    <select value={formData.team_id} onChange={e => setFormData({...formData, team_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
                                        <option value="">-- None --</option>
                                        <option value="NEW_TEAM" className="text-brand-500 font-bold">+ Add New Team</option>
                                        {filteredTeamsOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="INACTIVE">INACTIVE</option>
                                        <option value="PENDING">PENDING</option>
                                    </select>
                                </div>
                            </div>

                            {/* New Site Inline Form */}
                            {formData.site_id === 'NEW_SITE' && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 mt-4 space-y-3 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
                                    <h3 className="font-bold text-sm text-gray-800 dark:text-white/90 flex items-center"><Plus className="w-4 h-4 mr-1 text-brand-500"/> Create New Site</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Site Name</label>
                                            <input type="text" required value={newSiteData.name} onChange={e => setNewSiteData({...newSiteData, name: e.target.value})} className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm" placeholder="e.g. HDFC Phase 4" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Branch Code</label>
                                            <input type="text" required value={newSiteData.code} onChange={e => setNewSiteData({...newSiteData, code: e.target.value})} className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm" placeholder="e.g. HDFC123" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">State (For Holidays)</label>
                                            <select required value={newSiteData.state} onChange={e => setNewSiteData({...newSiteData, state: e.target.value})} className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm">
                                                <option value="">Select State</option>
                                                {Object.keys(holidays2026).map(st => (
                                                    <option key={st} value={st}>{st}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Address</label>
                                            <input type="text" value={newSiteData.address} onChange={e => setNewSiteData({...newSiteData, address: e.target.value})} className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm" placeholder="Full address" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* New Team Inline Form */}
                            {formData.team_id === 'NEW_TEAM' && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 mt-4 space-y-3 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-light-50 dark:bg-blue-light-500/100"></div>
                                    <h3 className="font-bold text-sm text-gray-800 dark:text-white/90 flex items-center"><Plus className="w-4 h-4 mr-1 text-blue-light-500 dark:text-blue-light-400"/> Create New Team</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Team Name</label>
                                            <input type="text" required value={newTeamData.name} onChange={e => setNewTeamData({...newTeamData, name: e.target.value})} className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="e.g. Alpha Team" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Link to Site</label>
                                            <select value={newTeamData.site_id} onChange={e => setNewTeamData({...newTeamData, site_id: e.target.value})} className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                                                <option value="">-- Independent Team --</option>
                                                {formData.site_id === 'NEW_SITE' && <option value="NEW_SITE">Link to New Site Being Created</option>}
                                                {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">State (For Holidays)</label>
                                        <select value={newTeamData.state} onChange={e => setNewTeamData({...newTeamData, state: e.target.value})} className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                                            <option value="">-- Inherit from Site --</option>
                                            {Object.keys(holidays2026).map(st => (
                                                <option key={st} value={st}>{st}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Photo</label>
                                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-500/10 file:text-brand-500 hover:file:bg-brand-500/20" />
                                    {formData.photo && (
                                        <div className="mt-2">
                                            <img 
                                                src={formData.photo.startsWith('data:image') ? formData.photo : `${api.defaults.baseURL.replace(/\/api$/, '')}/uploads/employees/${formData.photo}`} 
                                                alt="Preview" 
                                                className="w-16 h-20 object-cover border border-gray-200 dark:border-gray-800 rounded-md" 
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 rounded-lg">Cancel</button>
                                <button type="submit" disabled={submittingForm} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-500/90 flex items-center">
                                    {submittingForm ? 'Saving...' : 'Save Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {isPasswordOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-4">Reset Password</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">For {selectedEmp.name}</p>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                <input type="text" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setIsPasswordOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-warning-50 dark:bg-warning-500/100 text-white rounded-lg hover:bg-amber-600">Reset</button>
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
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all border border-gray-100 dark:border-gray-800">
                        <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-white/90">
                                {salaryModal.isApproveMode ? 'Approve Employee' : 'Update Assignments'}
                            </h3>
                            <button 
                                onClick={() => setSalaryModal({ isOpen: false, emp: null, isApproveMode: false })}
                                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {salaryModal.isApproveMode 
                                    ? `Please set the initial details for ${salaryModal.emp?.name} before approving.` 
                                    : `Update assignments for ${salaryModal.emp?.name}.`}
                            </p>
                            <form onSubmit={handleSaveSalary} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Salary (₹)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 dark:text-gray-400 font-medium">₹</span>
                                        </div>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            required
                                            autoFocus
                                            value={salaryInput} 
                                            onChange={e => setSalaryInput(e.target.value)} 
                                            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all font-medium text-gray-800 dark:text-white/90" 
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Team</label>
                                    <input 
                                        type="text" 
                                        placeholder="Search team..." 
                                        value={teamSearch}
                                        onChange={e => setTeamSearch(e.target.value)}
                                        className="w-full px-3 py-1.5 mb-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                                    />
                                    <select 
                                        value={teamInput} 
                                        onChange={e => setTeamInput(e.target.value)} 
                                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all text-gray-800 dark:text-white/90"
                                    >
                                        <option value="">-- No Team --</option>
                                        {filteredTeamsOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Site</label>
                                    <input 
                                        type="text" 
                                        placeholder="Search site..." 
                                        value={siteSearch}
                                        onChange={e => setSiteSearch(e.target.value)}
                                        className="w-full px-3 py-1.5 mb-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                                    />
                                    <select 
                                        value={siteInput} 
                                        onChange={e => setSiteInput(e.target.value)} 
                                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all text-gray-800 dark:text-white/90"
                                    >
                                        <option value="">-- No Site --</option>
                                        {filteredSitesOptions.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                                    </select>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setSalaryModal({ isOpen: false, emp: null, isApproveMode: false })} 
                                        className="px-5 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:bg-gray-800 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-5 py-2 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-500/90 transition-all shadow-theme-xs hover:shadow-md"
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
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-gray-800 dark:text-white/90 flex items-center">
                                <Wallet className="w-5 h-5 mr-2 text-brand-500" />
                                Salary Report: {salaryReportModal.emp?.name}
                            </h3>
                            <button 
                                onClick={() => setSalaryReportModal({ isOpen: false, emp: null, data: null })}
                                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 shrink-0">
                            <button onClick={() => changeReportMonth('prev')} className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex space-x-4 items-center">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 px-4 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800">
                                    {new Date(salaryReportModal.year, salaryReportModal.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h4>
                                <select 
                                    value={salaryReportModal.selectedState} 
                                    onChange={handleReportStateChange}
                                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                >
                                    <option value="">No State (No Holidays)</option>
                                    {Object.keys(holidays2026).map(st => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={() => changeReportMonth('next')} className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-800/50/50 custom-scrollbar">
                            {salaryReportModal.loading ? (
                                <div className="flex justify-center items-center py-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                                </div>
                            ) : salaryReportModal.data ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-xs text-center transform transition-transform hover:scale-105">
                                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Present</div>
                                            <div className="text-3xl font-black text-success-600 dark:text-success-500">{salaryReportModal.data.present_days}</div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-xs text-center transform transition-transform hover:scale-105">
                                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Half Days</div>
                                            <div className="text-3xl font-black text-warning-500 dark:text-warning-400">{salaryReportModal.data.half_days}</div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-xs text-center transform transition-transform hover:scale-105">
                                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Holidays</div>
                                            <div className="text-3xl font-black text-blue-light-500 dark:text-blue-light-400">{salaryReportModal.data.holiday_days || 0}</div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-xs text-center transform transition-transform hover:scale-105">
                                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Absent</div>
                                            <div className="text-3xl font-black text-error-500 dark:text-error-400">{salaryReportModal.data.absent_days}</div>
                                        </div>
                                        <div className="bg-brand-500/10 p-4 rounded-xl border border-brand-500/20 shadow-theme-xs text-center transform transition-transform hover:scale-105 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                                            <div className="text-xs font-bold text-brand-500/80 uppercase tracking-wider mb-1 relative z-10">Total</div>
                                            <div className="text-2xl font-black text-brand-500 relative z-10">₹{salaryReportModal.data.total_salary.toFixed(2)}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-theme-xs">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-semibold">
                                                <tr>
                                                    <th className="px-6 py-3">Date</th>
                                                    <th className="px-6 py-3 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {salaryReportModal.data.records.length > 0 ? (
                                                    salaryReportModal.data.records.map((r, i) => (
                                                        <tr key={i} className="hover:bg-gray-50 dark:bg-gray-800/50 transition-colors">
                                                            <td className="px-6 py-3 font-medium text-gray-700 dark:text-gray-300">
                                                                {new Date(r.attendance_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td className="px-6 py-3 text-right">
                                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                                                                    r.status === 'PRESENT' || r.status === 'WORKING' ? 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400 border-success-200 dark:border-success-800' :
                                                                    r.status === 'HALF_DAY' ? 'bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-400 border-warning-200 dark:border-warning-800' :
                                                                    'bg-error-50 dark:bg-error-500/10 text-red-700 border-error-200 dark:border-error-800'
                                                                }`}>
                                                                    {r.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="2" className="px-6 py-8 text-center text-gray-400 dark:text-gray-500 italic">
                                                            No attendance records found for {new Date(salaryReportModal.year, salaryReportModal.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-10">Failed to load data</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeManagement;
