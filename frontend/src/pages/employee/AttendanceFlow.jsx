import React, { useState, useEffect } from 'react'
import { MapPin, CheckCircle, Navigation } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const AttendanceFlow = () => {
  const [employee, setEmployee] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [loading, setLoading] = useState(true)

  const [status, setStatus] = useState('Ready to mark attendance')
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
    setProcessing(true)
    try {
      setStatus('Getting location...')

      const position = await getGPSLocation()

      const payload = {
        site_id: employee.site_id,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        acc: position.coords.accuracy,
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
      setStatus('Success')
    } catch (error) {
      console.error(error)
      let msg = error.response?.data?.error || error.message || 'Operation failed'
      if (error.response?.data?.distance) {
          msg += ` (Distance: ${error.response.data.distance}m, Max allowed: ${error.response.data.radius}m)`
      }
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
          <div className="p-10 text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-slate-50 rounded-full flex items-center justify-center border-4 border-slate-100">
                <Navigation className={`w-12 h-12 text-primary ${processing ? 'animate-pulse' : ''}`} />
            </div>
            
            <p
              className={`text-sm font-medium ${processing ? 'text-blue-600 animate-pulse' : 'text-slate-600'}`}
            >
              {status}
            </p>

            <button
              onClick={() =>
                handleAction(isCheckedIn ? 'CHECK OUT' : 'CHECK IN')
              }
              disabled={processing}
              className={`flex items-center justify-center space-x-2 w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all disabled:opacity-50
                                ${isCheckedIn ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30' : 'bg-primary hover:bg-primary/90 text-white shadow-primary/30'}
                            `}
            >
              {processing ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <MapPin className="w-6 h-6" />
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
