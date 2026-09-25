import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, Camera, X, RefreshCcw } from 'lucide-react';
import api from '../utils/api';
import logo from '../assets/crons-logo-light copy.svg';
import { getFaceDescriptor, hasFace } from '../utils/faceApi';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [role, setRole] = useState('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('');
  const [isProcessingFace, setIsProcessingFace] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const faceCheckInterval = useRef(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      const res = await api.post('/login', { username, password, role });
      // Redirect based on role
      if (res.data.role === 'admin') {
          navigate('/admin/dashboard');
      } else {
          navigate('/employee/dashboard');
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Too many failed attempts. Please try again in 15 minutes.');
      } else if (err.response?.status === 403) {
        setError(err.response?.data?.error || 'Account is inactive.');
      } else {
        setError(err.response?.data?.error || 'Invalid username or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setPhoto(reader.result);
              setFaceDescriptor(null); // Not captured via live camera
              setShowPhotoModal(false);
          };
          reader.readAsDataURL(file);
      }
  };

  const startCamera = async (mode = 'user') => {
      setFacingMode(mode);
      setShowPhotoModal(false);
      setShowCamera(true);
      setCameraStatus('Initializing camera...');
      try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
          setStream(mediaStream);
          if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              
              // Start checking for face continuously
              if (!faceCheckInterval.current) {
                  faceCheckInterval.current = setInterval(async () => {
                      if (videoRef.current && videoRef.current.readyState === 4 && !isProcessingFace) {
                          try {
                              const detected = await hasFace(videoRef.current);
                              setIsFaceDetected(detected);
                          } catch(e) {}
                      }
                  }, 500);
              }
          }
          setCameraStatus('Position your face clearly in the frame');
      } catch (err) {
          console.error(err);
          setCameraStatus('Failed to access camera.');
      }
  };

  const switchCamera = async () => {
      const newMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(newMode);
      
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
      }
      setCameraStatus('Switching camera...');
      
      try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newMode } });
          setStream(mediaStream);
          if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
          }
          setCameraStatus('Position your face clearly in the frame');
      } catch (err) {
          console.error(err);
          setCameraStatus('Failed to switch camera.');
      }
  };

  const stopCamera = () => {
      if (faceCheckInterval.current) {
          clearInterval(faceCheckInterval.current);
          faceCheckInterval.current = null;
      }
      setIsFaceDetected(false);
      
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
      }
      setShowCamera(false);
  };

  const captureFace = async () => {
      if (!videoRef.current) return;
      setIsProcessingFace(true);
      setCameraStatus('Detecting face...');
      
      try {
          const descriptor = await getFaceDescriptor(videoRef.current);
          if (!descriptor) {
              setCameraStatus('No face detected. Please try again.');
              setIsProcessingFace(false);
              return;
          }
          
          setCameraStatus('Face detected! Saving...');
          
          // capture photo from video
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          
          ctx.drawImage(videoRef.current, 0, 0);
          
          setPhoto(canvas.toDataURL('image/jpeg'));
          setFaceDescriptor(Array.from(descriptor));
          
          stopCamera();
      } catch (error) {
          console.error(error);
          setCameraStatus('Error occurred during detection.');
      } finally {
          setIsProcessingFace(false);
      }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!photo) {
        setError('Please capture or upload a profile photo');
        return;
    }
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
        const res = await api.post('/employee-signup', { name: `${firstName} ${lastName}`.trim(), phone, password, photo, face_descriptor: faceDescriptor });
        setSuccess(res.data.message);
        setIsSignUp(false);
        setUsername(res.data.username);
        setPassword('');
        setPhoto(null);
        setFaceDescriptor(null);
        setFirstName('');
        setLastName('');
        setPhone('');
    } catch (err) {
        setError(err.response?.data?.error || 'Registration failed');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary via-secondary/80 to-primary p-4">
      <div className="w-full max-w-md">
        
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="bg-white inline-block p-3 rounded-xl mb-6 shadow-sm border border-slate-100">
                <img src={logo} alt="Logo" className="h-16 md:h-20 w-auto object-contain" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h1>
              <p className="text-slate-500">
                  {isSignUp ? 'Sign up as a new employee' : 'Sign in to manage your invoices'}
              </p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium animate-pulse">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
                {success}
              </div>
            )}
            
            {!isSignUp && (
                <div className="flex justify-center mb-6 space-x-2 bg-slate-100 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setRole('employee')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${role === 'employee' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        EMPLOYEE
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${role === 'admin' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        ADMIN
                    </button>
                </div>
            )}
            
            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">
              {isSignUp ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <User className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-slate-50 outline-none text-slate-800"
                          placeholder="First Name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <User className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-slate-50 outline-none text-slate-800"
                          placeholder="Last Name"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-slate-50 outline-none text-slate-800"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Profile Photo</label>
                    <div className="flex items-center space-x-4">
                      {photo ? (
                        <div className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-primary">
                          <img src={photo} alt="Profile preview" className="h-full w-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setPhoto(null)} 
                            className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-xs font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setShowPhotoModal(true)} className="flex items-center justify-center w-full px-4 py-3 border border-slate-200 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                          <Camera className="w-5 h-5 text-slate-400 mr-2" />
                          <span className="text-sm font-medium text-slate-600">Take Photo / Upload</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-slate-50 outline-none text-slate-800"
                      placeholder="Enter username"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-slate-50 outline-none text-slate-800"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary/30 text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  isSignUp ? 'Sign Up' : 'Sign In'
                )}
              </button>

              <div className="text-center mt-4">
                <button
                    type="button"
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                        setSuccess('');
                        if (isSignUp) setRole('employee'); // reset role to employee when going back to sign in
                    }}
                    className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                    {isSignUp ? 'Already have an account? Sign In' : 'New employee? Sign Up here'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Photo Selection Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl relative">
            <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Choose Photo Source</h3>
            <div className="space-y-3">
              <button 
                type="button"
                onClick={() => startCamera('user')}
                className="flex items-center justify-center w-full px-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-5 h-5 mr-2" />
                Live Camera (Face Detection)
              </button>
              <label className="flex items-center justify-center w-full px-4 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                Select from Gallery
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
            <button 
              type="button" 
              onClick={() => setShowPhotoModal(false)}
              className="mt-6 w-full py-2 text-sm text-slate-500 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Live Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800">Face Registration</h3>
                    <div className="flex items-center space-x-3">
                        <button onClick={switchCamera} className="text-slate-600 hover:text-primary flex items-center bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Switch
                        </button>
                        <button onClick={stopCamera} className="text-slate-400 hover:text-red-500 p-1.5 bg-white border border-slate-200 rounded-lg transition-colors shadow-sm">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
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
                        <div className={`w-48 h-56 border-4 border-dashed rounded-full transition-all duration-300 ${isFaceDetected ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]'}`}></div>
                    </div>
                </div>
                
                <div className="p-4 text-center">
                    <p className={`text-sm mb-4 font-medium ${isProcessingFace ? 'text-blue-600 animate-pulse' : 'text-slate-600'}`}>
                        {cameraStatus}
                    </p>
                    
                    <button 
                        type="button"
                        onClick={captureFace} 
                        disabled={isProcessingFace || !stream}
                        className="flex items-center justify-center space-x-2 w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Camera className="w-5 h-5" />
                        <span>Capture Face</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Login;
