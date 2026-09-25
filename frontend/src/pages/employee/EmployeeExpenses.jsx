import React, { useState, useEffect, useRef } from 'react';
import { Plus, Camera, Upload, Receipt, IndianRupee, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const EmployeeExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        category: 'Travel',
        description: '',
        receipt_photo: null
    });
    
    // Camera handling
    const [useCamera, setUseCamera] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/my-expenses');
            setExpenses(res.data);
        } catch (err) {
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
            setUseCamera(true);
        } catch (err) {
            toast.error("Could not access camera");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setUseCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
            setFormData({ ...formData, receipt_photo: canvas.toDataURL('image/jpeg', 0.7) });
            stopCamera();
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, receipt_photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.category) {
            toast.error("Amount and Category are required");
            return;
        }
        
        try {
            await api.post('/my-expenses', formData);
            toast.success("Expense submitted successfully");
            setShowModal(false);
            setFormData({ amount: '', category: 'Travel', description: '', receipt_photo: null });
            fetchExpenses();
        } catch (err) {
            toast.error("Failed to submit expense");
        }
    };

    const getStatusIcon = (status) => {
        if (status === 'APPROVED') return <CheckCircle className="w-5 h-5 text-green-500" />;
        if (status === 'REJECTED') return <XCircle className="w-5 h-5 text-red-500" />;
        return <Clock className="w-5 h-5 text-amber-500" />;
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl">
                        <Receipt className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">My Expenses</h1>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Add Expense</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : expenses.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl text-center text-slate-500 border border-slate-100">
                    <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-lg font-medium">No expenses submitted yet</p>
                    <p className="text-sm mt-1">Click "Add Expense" to track your spending.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {expenses.map(exp => (
                        <div key={exp.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="font-bold text-slate-800 text-lg flex items-center">
                                        <IndianRupee className="w-4 h-4 mr-1" />
                                        {parseFloat(exp.amount).toFixed(2)}
                                    </div>
                                    <div className="text-sm text-slate-500 font-medium">{exp.category}</div>
                                </div>
                                <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                    exp.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                    exp.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                    {getStatusIcon(exp.status)}
                                    <span>{exp.status}</span>
                                </div>
                            </div>
                            {exp.description && (
                                <p className="text-sm text-slate-600 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">{exp.description}</p>
                            )}
                            <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                                <span>{new Date(exp.expense_date).toLocaleDateString('en-GB')}</span>
                                {exp.receipt_photo && (
                                    <span className="text-primary font-medium flex items-center">
                                        <Receipt className="w-3 h-3 mr-1" /> Receipt Attached
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Expense Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 dark:bg-gray-800/50">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white/90">New Expense</h2>
                            <button 
                                onClick={() => {
                                    setShowModal(false);
                                    stopCamera();
                                }} 
                                className="text-slate-400 hover:text-red-500"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
                                        <input 
                                            type="number" 
                                            required 
                                            min="1"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={e => setFormData({...formData, amount: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                        <select 
                                            value={formData.category}
                                            onChange={e => setFormData({...formData, category: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-primary outline-none text-slate-800 dark:text-white"
                                        >
                                            <option value="Travel">Travel</option>
                                            <option value="Food">Food & Meals</option>
                                            <option value="Material">Material/Tools</option>
                                            <option value="Fuel">Fuel</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                    <textarea 
                                        rows="2"
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none text-slate-800 dark:text-white"
                                        placeholder="Where or why was this spent?"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Receipt / Bill Photo</label>
                                    
                                    {!formData.receipt_photo && !useCamera && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <button 
                                                type="button" 
                                                onClick={startCamera}
                                                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-slate-500 hover:text-primary"
                                            >
                                                <Camera className="w-8 h-8 mb-2" />
                                                <span className="text-sm font-medium">Use Camera</span>
                                            </button>
                                            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-slate-500 hover:text-primary cursor-pointer">
                                                <Upload className="w-8 h-8 mb-2" />
                                                <span className="text-sm font-medium">Upload File</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                    )}

                                    {useCamera && !formData.receipt_photo && (
                                        <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4]">
                                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                                            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                                                <button type="button" onClick={stopCamera} className="bg-white text-slate-800 px-4 py-2 rounded-full font-bold shadow-lg text-sm">Cancel</button>
                                                <button type="button" onClick={capturePhoto} className="bg-primary text-white px-6 py-2 rounded-full font-bold shadow-lg text-sm">Capture</button>
                                            </div>
                                        </div>
                                    )}

                                    {formData.receipt_photo && (
                                        <div className="relative">
                                            <img src={formData.receipt_photo} alt="Receipt" className="w-full max-h-48 object-contain rounded-xl border border-slate-200 bg-slate-50" />
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({...formData, receipt_photo: null})}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    type="submit" 
                                    className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 mt-4"
                                >
                                    Submit Expense
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeExpenses;
