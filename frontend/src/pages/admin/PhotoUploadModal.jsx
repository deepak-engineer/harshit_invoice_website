import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PhotoUploadModal = ({ employee, onClose, onComplete }) => {
    const [processing, setProcessing] = useState(false);
    const [preview, setPreview] = useState(null);
    const [file, setFile] = useState(null);

    const handlePhotoChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const uploadPhoto = async () => {
        if (!preview) {
            toast.error('Please select a photo first');
            return;
        }
        setProcessing(true);
        try {
            // We need to send the full employee payload with the new photo
            const payload = {
                ...employee,
                photo: preview
            };
            
            await api.put(`/admin/employees/${employee.id}`, payload);
            
            toast.success('Photo uploaded successfully');
            onComplete();
        } catch (error) {
            console.error(error);
            toast.error('Failed to upload photo');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-gray-800 dark:text-white/90">Upload Photo: {employee.name}</h3>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 flex flex-col items-center">
                    {preview ? (
                        <div className="relative mb-6">
                            <img src={preview} alt="Preview" className="w-48 h-48 object-cover rounded-xl shadow-md border border-gray-200 dark:border-gray-700" />
                            <button 
                                onClick={() => { setPreview(null); setFile(null); }}
                                className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="w-full h-48 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mb-6 group">
                            <Upload className="w-8 h-8 text-gray-400 group-hover:text-brand-500 transition-colors mb-2" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-brand-600 transition-colors">Click to select photo</span>
                            <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handlePhotoChange}
                            />
                        </label>
                    )}
                    
                    <button 
                        onClick={uploadPhoto} 
                        disabled={processing || !preview}
                        className="flex items-center justify-center space-x-2 w-full py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-500/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Upload className="w-5 h-5" />}
                        <span>{processing ? 'Uploading...' : 'Upload Photo'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhotoUploadModal;
