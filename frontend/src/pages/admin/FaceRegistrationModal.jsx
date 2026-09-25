import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, Check } from 'lucide-react';
import { getFaceDescriptor } from '../../utils/faceApi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const FaceRegistrationModal = ({ employee, onClose, onComplete }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [status, setStatus] = useState('Initializing camera...');
    const [processing, setProcessing] = useState(false);
    
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStatus('Position face clearly in the frame');
        } catch (err) {
            console.error(err);
            setStatus('Failed to access camera. Please check permissions.');
        }
    };

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line
    }, []);

    const captureFace = async () => {
        if (!videoRef.current) return;
        setProcessing(true);
        setStatus('Detecting face...');
        
        try {
            const descriptor = await getFaceDescriptor(videoRef.current);
            
            if (!descriptor) {
                setStatus('No face detected. Please try again.');
                setProcessing(false);
                return;
            }
            
            setStatus('Face detected! Saving...');
            
            // Send descriptor to backend
            await api.post(`/admin/employees/${employee.id}/face`, {
                descriptor: Array.from(descriptor)
            });
            
            toast.success('Face registered successfully');
            onComplete();
        } catch (error) {
            console.error(error);
            setStatus('Error occurred during registration.');
            toast.error('Failed to register face');
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-gray-800 dark:text-white/90">Register Face: {employee.name}</h3>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-4 flex flex-col items-center bg-slate-900 relative">
                    <video 
                        ref={videoRef}
                        autoPlay 
                        playsInline
                        muted
                        className="w-full h-64 object-cover rounded-lg bg-black"
                    />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-56 border-2 border-dashed border-white/50 rounded-full"></div>
                    </div>
                </div>
                
                <div className="p-4 text-center">
                    <p className={`text-sm mb-4 font-medium ${processing ? 'text-blue-light-600 dark:text-blue-light-500 animate-pulse' : 'text-gray-600 dark:text-gray-400'}`}>
                        {status}
                    </p>
                    
                    <button 
                        onClick={captureFace} 
                        disabled={processing || !stream}
                        className="flex items-center justify-center space-x-2 w-full py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-500/90 transition-colors disabled:opacity-50"
                    >
                        {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Camera className="w-5 h-5" />}
                        <span>{processing ? 'Processing...' : 'Capture & Save'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FaceRegistrationModal;
