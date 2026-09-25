import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Upload, CheckCircle, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const WorkChecklist = () => {
    const navigate = useNavigate();
    const [workOrder, setWorkOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    
    // For photos
    const fileInputRef = useRef(null);
    const [uploadingItem, setUploadingItem] = useState(null);

    useEffect(() => {
        fetchWorkOrder();
    }, []);

    const fetchWorkOrder = async () => {
        try {
            const res = await api.get('/work-orders/current');
            setWorkOrder(res.data);
        } catch (error) {
            // No current work order, we show the "Start Work" button
            setWorkOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const handleStartWork = async () => {
        setStarting(true);
        try {
            const res = await api.post('/work-orders/start');
            toast.success('Work started!');
            fetchWorkOrder();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to start work. Are you checked in?');
        } finally {
            setStarting(false);
        }
    };

    const updateChecklist = async (itemId, status) => {
        try {
            await api.put(`/work-orders/${workOrder.id}/checklist/${itemId}`, { status });
            toast.success('Updated successfully');
            fetchWorkOrder();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const triggerUpload = (itemId) => {
        setUploadingItem(itemId);
        fileInputRef.current.click();
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                toast.loading('Uploading photo...');
                await api.post(`/work-orders/${workOrder.id}/photos`, {
                    photo: reader.result,
                    photo_type: 'CHECKLIST',
                    checklist_item_id: uploadingItem
                });
                toast.dismiss();
                toast.success('Photo uploaded!');
                fetchWorkOrder();
            } catch (err) {
                toast.dismiss();
                toast.error('Upload failed');
            } finally {
                e.target.value = null; // reset
            }
        };
        reader.readAsDataURL(file);
    };

    const handleCompleteWork = async () => {
        const hasPending = workOrder.checklist.some(i => i.status === 'PENDING');
        if (hasPending) {
            toast.error('Please complete all checklist items first');
            return;
        }

        try {
            await api.post(`/work-orders/${workOrder.id}/complete`);
            toast.success('Work Completed successfully!');
            fetchWorkOrder();
            navigate('/employee/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to complete');
        }
    };

    if (loading) return <div>Loading...</div>;

    if (!workOrder) {
        return (
            <div className="max-w-md mx-auto mt-10 text-center space-y-6">
                <CheckSquare className="w-16 h-16 mx-auto text-primary" />
                <h2 className="text-2xl font-bold text-slate-800">Site Work</h2>
                <p className="text-slate-500">You are checked in. Start your site work checklist to proceed.</p>
                <button 
                    onClick={handleStartWork}
                    disabled={starting}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 disabled:opacity-50"
                >
                    {starting ? 'Starting...' : 'Start Work'}
                </button>
            </div>
        );
    }

    if (workOrder.status === 'COMPLETED') {
        return (
            <div className="max-w-md mx-auto mt-10 text-center space-y-6">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                <h2 className="text-2xl font-bold text-slate-800">Work Completed</h2>
                <p className="text-slate-500">You have completed all tasks for this site.</p>
                <button onClick={() => navigate('/employee/dashboard')} className="text-primary font-bold">Back to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto space-y-6">
            <div className="flex items-center space-x-3">
                <button onClick={() => navigate('/employee/dashboard')} className="p-2 rounded-full hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-slate-800">Work Checklist</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-700">DSC Panel Tasks</p>
                </div>
                <div className="divide-y divide-slate-100">
                    {workOrder.checklist.map(item => {
                        const itemPhotos = workOrder.photos.filter(p => p.checklist_item_id === item.id);
                        
                        return (
                            <div key={item.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-medium text-slate-800">{item.item_name}</h3>
                                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                                        item.status === 'PASSED' ? 'bg-green-100 text-green-700' :
                                        item.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                        item.status === 'NOT_APPLICABLE' ? 'bg-slate-200 text-slate-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {item.status}
                                    </span>
                                </div>
                                
                                <div className="flex space-x-2">
                                    <select 
                                        value={item.status}
                                        onChange={(e) => updateChecklist(item.id, e.target.value)}
                                        className="text-sm border rounded p-1.5 focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="PASSED">Passed</option>
                                        <option value="FAILED">Failed</option>
                                        <option value="NOT_APPLICABLE">N/A</option>
                                    </select>
                                    
                                    <button 
                                        onClick={() => triggerUpload(item.id)}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-sm font-medium"
                                    >
                                        <Upload className="w-4 h-4" />
                                        <span>Photo</span>
                                    </button>
                                </div>

                                {itemPhotos.length > 0 && (
                                    <div className="flex space-x-2 overflow-x-auto py-2">
                                        {itemPhotos.map(photo => (
                                            <img key={photo.id} src={`${api.defaults.baseURL.replace('/api', '')}/uploads/work/${photo.photo_url}`} alt="proof" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

            <button 
                onClick={handleCompleteWork}
                className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 shadow-lg shadow-green-500/30 flex justify-center items-center"
            >
                <CheckCircle className="w-6 h-6 mr-2" />
                Complete Work
            </button>
        </div>
    );
};

export default WorkChecklist;
