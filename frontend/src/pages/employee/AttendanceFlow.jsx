import React, { useState, useEffect, useRef } from 'react'
import { Camera, MapPin, CheckCircle, XCircle } from 'lucide-react'
import { getFaceDescriptor, compareDescriptors } from '../../utils/faceApi'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const AttendanceFlow = () => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [employee, setEmployee] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [loading, setLoading] = useState(true)

  const [stream, setStream] = useState(null)
  const [status, setStatus] = useState('Initializing...')
  const [processing, setProcessing] = useState(false)

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

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setStatus('Camera ready. Please align your face.')
    } catch (err) {
      console.error(err)
      setStatus('Camera access denied. Cannot mark attendance.')
    }
  }

  useEffect(() => {
    if (
      !loading &&
      employee &&
      (!attendance || attendance.status === 'WORKING')
    ) {
      startCamera()
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line
  }, [loading, attendance])

  const captureImage = () => {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    return canvas.toDataURL('image/jpeg')
  }

  const getGPSLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        })
      }
    })
  }

  const handleAction = async (type) => {
    if (!videoRef.current || !employee.face_descriptor) {
      toast.error('Please register your face first')
      return
    }

    setProcessing(true)
    try {
      setStatus('Detecting face...')
      const descriptor = await getFaceDescriptor(videoRef.current)
      if (!descriptor) {
        throw new Error('No face detected. Please try again.')
      }

      const registeredDescriptor = JSON.parse(employee.face_descriptor)
      const { match, distance } = compareDescriptors(
        descriptor,
        registeredDescriptor,
      )

      if (!match) {
        throw new Error('Face verification failed! You are not recognized.')
      }

      setStatus('Face verified! Getting location...')

      const position = await getGPSLocation()

      const payload = {
        site_id: employee.site_id,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        acc: position.coords.accuracy,
        photo: captureImage(),
        face_score: distance,
      }

      setStatus(`Marking ${type}...`)

      if (type === 'CHECK IN') {
        await api.post('/attendance/check-in', payload)
        toast.success('Checked in successfully!')
      } else {
        const res = await api.post('/attendance/check-out', payload)
        toast.success(
          `Checked out! Worked ${Math.floor(res.data.minutes / 60)}h ${res.data.minutes % 60}m`,
        )
      }

      fetchMe() // Refresh
    } catch (error) {
      console.error(error)
      const msg =
        error.response?.data?.error || error.message || 'Operation failed'
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
          <div className="p-4 flex flex-col items-center bg-slate-900 relative">
            {!employee.face_registered ? (
              <div className="h-64 w-full flex flex-col items-center justify-center text-red-300 px-4 text-center">
                <XCircle className="w-12 h-12 mb-2" />
                <p>Face not registered. Contact admin.</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-72 object-cover rounded-xl bg-black"
                />
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-56 h-64 border-2 border-dashed border-white/50 rounded-[40px]"></div>
                </div>
              </>
            )}
          </div>
        )}

        {!isCompleted && (
          <div className="p-6 text-center space-y-4">
            <p
              className={`text-sm font-medium ${processing ? 'text-blue-600 animate-pulse' : 'text-slate-600'}`}
            >
              {status}
            </p>

            <button
              onClick={() =>
                handleAction(isCheckedIn ? 'CHECK OUT' : 'CHECK IN')
              }
              disabled={processing || !stream || !employee.face_registered}
              className={`flex items-center justify-center space-x-2 w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all disabled:opacity-50
                                ${isCheckedIn ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30' : 'bg-primary hover:bg-primary/90 text-white shadow-primary/30'}
                            `}
            >
              {processing ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Camera className="w-6 h-6" />
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
    </div>
  )
}

export default AttendanceFlow
