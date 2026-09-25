import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, CheckCircle, Camera, Upload, X, RefreshCcw } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import Webcam from 'react-webcam'

const AttendanceFlow = () => {
  const [employee, setEmployee] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [loading, setLoading] = useState(true)

  const [status, setStatus] = useState('Ready to mark attendance')
  const [processing, setProcessing] = useState(false)
  
  // Modal & Camera state
  const [showModal, setShowModal] = useState(false)
  const [facingMode, setFacingMode] = useState('environment')
  const webcamRef = useRef(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoBase64, setPhotoBase64] = useState(null)

  const fetchMe = async () => {
    try {
      const [meRes, attRes] = await Promise.all([
        api.get('/me'),
        api.get('/me/attendance'),
      ])
      setEmployee(meRes.data)
      setAttendance(attRes.data.today)
    } catch (error) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMe()
  }, [])

  const capture = useCallback(() => {
    if (!webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot()
    setPhotoPreview(imageSrc)
    setPhotoBase64(imageSrc)
  }, [webcamRef])

  const triggerCheckIn = () => {
    setShowModal(true)
    setPhotoPreview(null)
    setPhotoBase64(null)
  }

  const handleAction = async (type) => {
    if (type === 'CHECK IN' && !photoBase64) {
        toast.error('Please upload a photo of the register entry first.')
        return
    }

    setProcessing(true)
    try {
      setStatus(`Marking ${type}...`)

      const payload = {
        site_id: employee.site_id,
        photo: photoBase64
      }

      if (type === 'CHECK IN') {
        await api.post('/attendance/check-in', payload)
        toast.success('Checked in successfully!')
        setShowModal(false)
      } else {
        const res = await api.post('/attendance/check-out', payload)
        toast.success(
          `Checked out! Worked ${Math.floor(res.data.minutes / 60)}h ${res.data.minutes % 60}m`,
        )
      }

      setPhotoPreview(null)
      setPhotoBase64(null)
      fetchMe() // Refresh
      setStatus('Success')
    } catch (error) {
      console.error(error)
      let msg = error.response?.data?.error || error.message || 'Operation failed'
      setStatus(`Failed: ${msg}`)
      toast.error(msg)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>

  if (!employee.site_id) {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-red-700">
        You do not have an assigned site. Please contact the administrator.
      </div>
    )
  }

  const isCheckedIn = attendance && attendance.status === 'WORKING'
  const isCompleted = attendance && attendance.status !== 'WORKING'

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white/90">Attendance</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-gray-800/50 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Assigned Site</p>
            <p className="font-bold text-slate-800 dark:text-white/90 flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-primary" />
              {employee.site?.name}
            </p>
          </div>
          {isCheckedIn && (
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Checked In</p>
              <p className="font-bold text-green-600 dark:text-green-400">
                {new Date(attendance.check_in_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>

        {isCompleted ? (
          <div className="p-8 text-center flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white/90">
              Attendance Completed
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              You have completed your attendance for today.
            </p>
          </div>
        ) : (
          <div className="p-8 text-center space-y-6">
            <p
              className={`text-sm font-medium ${processing ? 'text-blue-600 animate-pulse' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {status}
            </p>

            <button
              onClick={() => {
                if (isCheckedIn) {
                    handleAction('CHECK OUT')
                } else {
                    triggerCheckIn()
                }
              }}
              disabled={processing}
              className={`flex items-center justify-center space-x-2 w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                ${isCheckedIn ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30' : 'bg-primary hover:bg-primary/90 text-white shadow-primary/30'}
                            `}
            >
              {processing ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                isCheckedIn ? <CheckCircle className="w-6 h-6" /> : <Camera className="w-6 h-6" />
              )}
              <span>
                {processing
                  ? 'Processing...'
                  : isCheckedIn
                    ? 'CHECK OUT'
                    : 'CHECK IN'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Modal for Check-In Photo */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white/90">Upload Entry Register photo</h3>
                    <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-4 flex-1 flex flex-col items-center bg-gray-50 dark:bg-gray-800/50">
                    {photoPreview ? (
                        <div className="w-full relative rounded-xl overflow-hidden border-2 border-primary">
                            <img src={photoPreview} alt="Captured" className="w-full h-auto object-cover" />
                        </div>
                    ) : (
                        <div className="w-full relative rounded-xl overflow-hidden bg-black border-2 border-gray-200 dark:border-gray-700">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{ facingMode, width: { ideal: 720 }, height: { ideal: 720 } }}
                                className="w-full h-auto object-cover"
                            />
                            <button 
                                onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm transition-all shadow-lg"
                                title="Flip Camera"
                            >
                                <RefreshCcw className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                    {photoPreview ? (
                        <>
                            <button 
                                onClick={() => setPhotoPreview(null)}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                            >
                                Retake
                            </button>
                            <button 
                                onClick={() => handleAction('CHECK IN')}
                                disabled={processing}
                                className="flex-[2] py-3 px-4 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all flex justify-center items-center"
                            >
                                {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Confirm & Check In'}
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={capture}
                            className="w-full py-3 px-4 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 shadow-lg transition-all flex justify-center items-center space-x-2"
                        >
                            <Camera className="w-5 h-5" />
                            <span>Capture Photo</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  )
}

export default AttendanceFlow
