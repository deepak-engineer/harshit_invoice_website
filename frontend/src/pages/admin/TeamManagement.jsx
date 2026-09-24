import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
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
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Team Management</h1>
                <button onClick={openNew} className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                    <Plus className="w-5 h-5" />
                    <span>Add Team</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Team Name</th>
                            <th className="px-6 py-4">Assigned Site</th>
                            <th className="px-6 py-4">Members</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {teams.map(team => (
                            <tr key={team.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono text-xs">{team.id}</td>
                                <td className="px-6 py-4 font-medium text-slate-800">{team.name}</td>
                                <td className="px-6 py-4 text-xs">
                                    {team.site_id ? sites.find(s => s.id === team.site_id)?.code || 'Unknown' : <span className="text-slate-400 italic">None</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                                        {team.employee_ids?.length || 0}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex space-x-3">
                                        <button onClick={() => openEdit(team)} className="text-blue-600 hover:text-blue-800">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(team.id)} className="text-red-600 hover:text-red-800">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {teams.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                    No teams found. Create one above!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] flex flex-col">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">{editId ? 'Edit Team' : 'New Team'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-32">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">State (For Holidays)</label>
                                    <select value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                                        <option value="">-- Default (From Site) --</option>
                                        {Object.keys(holidays2026).map(st => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Team Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Morning Squad" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Site (Optional)</label>
                                    <select value={formData.site_id} onChange={e => setFormData({...formData, site_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                                        <option value="">-- None --</option>
                                        {sites.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Assign Employees</label>
                                <div className="border border-slate-200 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                                    {employees.map(emp => (
                                        <label key={emp.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.employee_ids.includes(emp.id)}
                                                onChange={() => handleEmployeeToggle(emp.id)}
                                                className="w-4 h-4 text-primary rounded focus:ring-primary"
                                            />
                                            <div>
                                                <div className="text-sm font-medium text-slate-700">{emp.name}</div>
                                                <div className="text-xs text-slate-500">{emp.username} {emp.team_id && emp.team_id !== editId && '(Already in another team)'}</div>
                                            </div>
                                        </label>
                                    ))}
                                    {employees.length === 0 && (
                                        <div className="text-sm text-slate-500 p-2 text-center">No employees found.</div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">Save Team</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
