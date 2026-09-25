import React, { useState, useEffect, useRef } from 'react'
import { MapPin, CheckCircle, Camera, Upload } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const AttendanceFlow = () => {
  const [employee, setEmployee] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [loading, setLoading] = useState(true)

  const [status, setStatus] = useState('Upload register photo to mark attendance')
  const [processing, setProcessing] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoBase64, setPhotoBase64] = useState(null)
  const fileInputRef = useRef(null)

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

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file.')
        return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
            // Resize image to max 800x800 to save bandwidth
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height
            const maxSize = 800

            if (width > height && width > maxSize) {
                height *= maxSize / width
                width = maxSize
            } else if (height > maxSize) {
                width *= maxSize / height
                height = maxSize
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)

            const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8)
            setPhotoPreview(resizedBase64)
            
            // Remove the data:image/jpeg;base64, prefix for the backend
            const base64Data = resizedBase64.split(',')[1]
            setPhotoBase64(base64Data)
            setStatus('Photo captured. Ready to submit.')
        }
        img.src = event.target.result
    }
    reader.readAsDataURL(file)
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

  if (loading) return <div>Loading...</div>

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
        <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
        <p className="text-slate-500">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">Assigned Site</p>
            <p className="font-bold text-slate-800 flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-primary" />
              {employee.site?.name}
            </p>
          </div>
          {isCheckedIn && (
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500">Checked In</p>
              <p className="font-bold text-green-600">
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
            <h3 className="text-xl font-bold text-slate-800">
              Attendance Completed
            </h3>
            <p className="text-slate-500 mt-2">
              You have completed your attendance for today.
            </p>
          </div>
        ) : (
          <div className="p-8 text-center space-y-6">
            
            {!isCheckedIn && (
                <div className="space-y-4">
                    <p className="text-sm font-medium text-slate-600">Upload Register Entry Photo</p>
                    
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        onChange={handlePhotoCapture} 
                        className="hidden" 
                        ref={fileInputRef} 
                    />
                    
                    {photoPreview ? (
                        <div className="relative w-48 h-48 mx-auto rounded-xl overflow-hidden border-2 border-primary cursor-pointer" onClick={() => fileInputRef.current.click()}>
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    ) : (
                        <div 
                            onClick={() => fileInputRef.current.click()}
                            className="w-48 h-48 mx-auto bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-primary transition-colors"
                        >
                            <Upload className="w-10 h-10 text-slate-400 mb-2" />
                            <span className="text-sm text-slate-500">Tap to Camera</span>
                        </div>
                    )}
                </div>
            )}
            
            <p
              className={`text-sm font-medium ${processing ? 'text-blue-600 animate-pulse' : 'text-slate-600'}`}
            >
              {status}
            </p>

            <button
              onClick={() =>
                handleAction(isCheckedIn ? 'CHECK OUT' : 'CHECK IN')
              }
              disabled={processing || (!isCheckedIn && !photoBase64)}
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
                    : 'CHECK IN WITH PHOTO'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AttendanceFlow
