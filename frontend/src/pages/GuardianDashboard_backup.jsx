import React, { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Activity,
  Users,
  ShieldAlert,
  Phone,
} from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { contactsAPI } from '../api/contactsApi'
import { useAuth } from '../hooks/useAuth'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export const GuardianDashboardPage = () => {
  const { user: authUser } = useAuth()
  const { user, notifications } = useAppContext()
  const [monitoredUsers, setMonitoredUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [summaryData, setSummaryData] = useState(null)

  // Fetch monitored users from backend
  useEffect(() => {
    const fetchMonitoredUsers = async () => {
      try {
        setLoading(true)
        const response = await contactsAPI.getMonitoredUsers()
        const users = response?.data || []
        setMonitoredUsers(users)
        if (users && users.length > 0) {
          setSelectedUser(users[0])
          loadUserSummary(users[0].user._id)
        }
      } catch (error) {
        console.error('Error fetching monitored users:', error)
        setMonitoredUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchMonitoredUsers()
  }, [])

  const loadUserSummary = async (userId) => {
    try {
      setSummaryData({
        moodData: [
          { date: 'Mon', mood: 3 },
          { date: 'Tue', mood: 4 },
          { date: 'Wed', mood: 3 },
          { date: 'Thu', mood: 4 },
          { date: 'Fri', mood: 5 },
          { date: 'Sat', mood: 4 },
          { date: 'Sun', mood: 3 },
        ],
        goals: [
          { id: 1, title: 'Exercise 3x per week', status: 'in_progress' },
          { id: 2, title: 'Daily meditation', status: 'completed' },
          { id: 3, title: 'Read a book', status: 'not_started' },
        ],
        isEmergencyActive: selectedUser?.emergencyActive || false,
        lastActive: selectedUser?.lastActiveAt,
      })
    } catch (error) {
      console.error('Error loading user summary:', error)
    }
  }

  const handleUserChange = (user) => {
    setSelectedUser(user)
    loadUserSummary(user.user._id)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 animate-pulse space-y-6 p-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-40 bg-gray-200 rounded-2xl"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  if (monitoredUsers.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Monitored Users
            </h2>
            <p className="text-gray-500">
              You are not currently monitoring any users. Wait for a user to add you as an emergency contact.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const guardianNotifs = notifications?.filter(
    (n) => n.role === 'emergency_contact',
  ) || []

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-1">
          Welcome, {authUser?.name || 'Guardian'}!
        </h2>
        <p className="text-gray-600">
          You are monitoring <span className="font-semibold">{selectedUser?.user?.name}</span> as their <span className="font-semibold capitalize">{selectedUser?.relationship}</span>.
        </p>
      </div>

      {/* User Selector */}
      {monitoredUsers.length > 1 && (
        <div className="mb-8">
          <select
            value={selectedUser?._id || ''}
            onChange={(e) => {
              const user = monitoredUsers.find(u => u._id === e.target.value)
              if (user) handleUserChange(user)
            }}
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 outline-none"
          >
            {monitoredUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.user?.name} ({u.relationship})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Emergency Alert */}
        {summaryData?.isEmergencyActive && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-2xl">
            <div className="flex items-start gap-4">
              <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-red-900 mb-2">
                  EMERGENCY MODE ACTIVE
                </h2>
                <p className="text-red-800 text-sm mb-4">
                  {selectedUser?.user?.name || 'This user'} has activated emergency mode. Please contact them immediately.
                </p>
                <div className="flex gap-3">
                  <a
                    href={`tel:${selectedUser?.user?.phoneNumber || '+1234567890'}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                  >
                    <Phone className="w-4 h-4" /> Call
                  </a>
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50">
                    View Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mood Chart */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Mood Trends (Last 7 Days)
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summaryData?.moodData}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#colorMood)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Panels */}
          <div className="space-y-6">
            {/* Activity Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Last active: {summaryData?.lastActive ? new Date(summaryData.lastActive).toLocaleString() : 'N/A'}
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                {summaryData?.isEmergencyActive ? 'In Emergency' : 'Active'}
              </div>
            </div>

            {/* Alerts Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
              </div>
              {guardianNotifs.length > 0 ? (
                <div className="space-y-3">
                  {guardianNotifs.slice(0, 3).map((n) => (
                    <div key={n.id} className="text-sm border-l-2 border-red-500 pl-3 py-1">
                      <p className="font-medium text-gray-900">{n.title}</p>
                      <p className="text-gray-500 text-xs">{new Date(n.timestamp).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent alerts.</p>
              )}
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Goals */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Goal Progress</h2>
            <div className="space-y-3">
              {summaryData?.goals?.map((g) => (
                <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{g.title}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    g.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : g.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {g.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Other Contacts */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Other Contacts</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Coordinate with {selectedUser?.user?.name || 'this user'}'s other emergency contacts.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Dr. Emily Chen</p>
                  <p className="text-xs text-gray-500">Therapist</p>
                </div>
                <a href="tel:+94719876543" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full">
                  <Phone className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Kamal Perera</p>
                  <p className="text-xs text-gray-500">Friend</p>
                </div>
                <a href="tel:+94711234567" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full">
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GuardianDashboardPage
