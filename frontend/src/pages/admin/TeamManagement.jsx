import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { holidays2026 } from '../../utils/holidays2026';

const TeamManagement = () => {
    const [teams, setTeams] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        site_id: '',
        employee_ids: [],
        state: ''
    });
    const [editId, setEditId] = useState(null);
    
    // Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filteredTeams, setFilteredTeams] = useState([]);

    const fetchTeams = async () => {
        try {
            const [teamRes, empRes, siteRes] = await Promise.all([
                api.get('/admin/teams'),
                api.get('/admin/employees'),
                api.get('/admin/sites')
            ]);
            setTeams(teamRes.data);
            setEmployees(empRes.data);
            setSites(siteRes.data);
        } catch (error) {
            toast.error('Failed to load team data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (!debouncedSearch) {
            setFilteredTeams(teams);
        } else {
            const lowerSearch = debouncedSearch.toLowerCase();
            setFilteredTeams(teams.filter(team => {
                const site = sites.find(s => s.id === team.site_id);
                const siteCodeMatch = site && site.code && site.code.toLowerCase().includes(lowerSearch);
                const nameMatch = team.name && team.name.toLowerCase().includes(lowerSearch);
                const idMatch = team.id && team.id.toString() === lowerSearch;
                return nameMatch || siteCodeMatch || idMatch;
            }));
        }
    }, [debouncedSearch, teams, sites]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/admin/teams/${editId}`, formData);
                toast.success('Team updated successfully');
            } else {
                await api.post('/admin/teams', formData);
                toast.success('Team created successfully');
            }
            setIsModalOpen(false);
            fetchTeams();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this team? Employees in this team will be unassigned from it.')) {
            return;
        }
        try {
            await api.delete(`/admin/teams/${id}`);
            toast.success('Team deleted successfully');
            fetchTeams();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        }
    };

    const openEdit = (team) => {
        setFormData({ 
            name: team.name,
            site_id: team.site_id || '',
            employee_ids: team.employee_ids || [],
            state: team.state || ''
        });
        setEditId(team.id);
        setIsModalOpen(true);
    };

    const openNew = () => {
        setFormData({ name: '', site_id: '', employee_ids: [], state: '' });
        setEditId(null);
        setIsModalOpen(true);
    };

    const handleEmployeeToggle = (empId) => {
        setFormData(prev => {
            const ids = prev.employee_ids.includes(empId) 
                ? prev.employee_ids.filter(id => id !== empId)
                : [...prev.employee_ids, empId];
            return { ...prev, employee_ids: ids };
        });
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Team Management</h1>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <input 
                        type="text" 
                        placeholder="Search by Team or Site Code..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-theme-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-500"
                    />
                    <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition-colors">
                        <Plus className="w-5 h-5" />
                        <span>Add Team</span>
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6 dark:border-gray-800 dark:bg-white/3">
                <div className="hidden lg:block max-w-full overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-y border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">ID</th>
                                <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Team Name</th>
                                <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Assigned Site</th>
                                <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Members</th>
                                <th className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredTeams.map(team => (
                                <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="py-3 px-2 text-sm font-mono text-gray-500 dark:text-gray-400">{team.id}</td>
                                    <td className="py-3 px-2 text-sm font-medium text-gray-800 dark:text-white/90">{team.name}</td>
                                    <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">
                                        {team.site_id ? sites.find(s => s.id === team.site_id)?.code || 'Unknown' : <span className="text-gray-400 italic">None</span>}
                                    </td>
                                    <td className="py-3 px-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                            {team.employee_ids?.length || 0}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex space-x-3">
                                            <button onClick={() => openEdit(team)} className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500 transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(team.id)} className="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTeams.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No teams found. Create one above!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Grid View */}
                <div className="lg:hidden mt-4 space-y-4">
                    {filteredTeams.map(team => (
                        <div key={team.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3 flex flex-col space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium text-gray-800 dark:text-white/90 leading-tight">{team.name}</h3>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {team.id}</p>
                                </div>
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 shrink-0">
                                    <Users className="w-3 h-3 mr-1" />
                                    {team.employee_ids?.length || 0} Members
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2 text-xs bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                <div>
                                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Assigned Site</span>
                                    <span className="font-medium text-gray-800 dark:text-white/90">
                                        {team.site_id ? sites.find(s => s.id === team.site_id)?.code || 'Unknown' : <span className="text-gray-400 italic">None</span>}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex justify-end items-center pt-2 gap-2">
                                <button onClick={() => openEdit(team)} className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-brand-500 hover:border-brand-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-brand-800 dark:hover:text-brand-500 transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(team.id)} className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-error-500 hover:border-error-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-error-800 dark:hover:text-error-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredTeams.length === 0 && (
                        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">No teams found. Create one above!</div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] flex flex-col">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-4">{editId ? 'Edit Team' : 'New Team'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-16">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">State (For Holidays)</label>
                                    <select value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-theme-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90 dark:bg-gray-900">
                                        <option value="">-- Default (From Site) --</option>
                                        {Object.keys(holidays2026).map(st => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Team Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-theme-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90" placeholder="e.g. Morning Squad" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mt-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Site (Optional)</label>
                                    <select value={formData.site_id} onChange={e => setFormData({...formData, site_id: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-theme-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90 dark:bg-gray-900">
                                        <option value="">-- None --</option>
                                        {sites.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Assign Employees</label>
                                <div className="rounded-lg border border-gray-300 dark:border-gray-700 p-2 max-h-48 overflow-y-auto space-y-1">
                                    {employees.map(emp => (
                                        <label key={emp.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.employee_ids.includes(emp.id)}
                                                onChange={() => handleEmployeeToggle(emp.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                                            />
                                            <div>
                                                <div className="text-sm font-medium text-gray-800 dark:text-white/90">{emp.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{emp.username} {emp.team_id && emp.team_id !== editId && '(Already in another team)'}</div>
                                            </div>
                                        </label>
                                    ))}
                                    {employees.length === 0 && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 p-2 text-center">No employees found.</div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3">Cancel</button>
                                <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition-colors">Save Team</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
