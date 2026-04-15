import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  AlertTriangle,
  Activity,
  Users,
  ShieldAlert,
  Phone,
  LogOut,
  Bell,
} from 'lucide-react'
import Button from '../components/common/Button'
import toast from 'react-hot-toast'
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
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [moodData, setMoodData] = useState([])
  const [goals, setGoals] = useState([])
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [highRiskAlerts, setHighRiskAlerts] = useState([
    { id: 1, name: 'John Doe', risk: 'High', timestamp: '2 hours ago' },
  ])
  const [newContacts, setNewContacts] = useState([
    { id: 1, name: 'Jane Smith', added: '1 hour ago', relationship: 'Sister' },
  ])

  useEffect(() => {
    if (!user || user.role !== 'emergency_contact') {
      navigate('/guardian-login')
      return
    }
    loadDashboardData()
  }, [user, navigate])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Mock data for now - simulating wellness status
      setMoodData([
        { date: 'Mon', mood: 4 },
        { date: 'Tue', mood: 4.5 },
        { date: 'Wed', mood: 3.5 },
        { date: 'Thu', mood: 4 },
        { date: 'Fri', mood: 3 },
        { date: 'Sat', mood: 4.5 },
        { date: 'Sun', mood: 4 },
      ])
      setGoals([
        { id: 1, title: 'Daily Meditation', status: 'in_progress' },
        { id: 2, title: 'Exercise 30 mins', status: 'in_progress' },
        { id: 3, title: 'Journal Reflection', status: 'completed' },
      ])
      setIsEmergencyActive(false)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Header for Emergency Contact */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Logo and Title */}
            <div className="flex items-center gap-6">
              {/* MindMate Logo */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-bold text-gray-900">MindMate</span>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-gray-200"></div>

              {/* Guardian Dashboard Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Guardian Dashboard
                </h1>
                <p className="text-xs text-gray-500">
                  Emergency contact monitoring
                </p>
              </div>
            </div>

            {/* Right - Notification and Logout */}
            <div className="flex items-center gap-4">
              {/* Notification Bell Button */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>

                    {/* High Risk Alerts */}
                    {highRiskAlerts.length > 0 && (
                      <div className="p-4 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-700 mb-3">High Risk Alerts</p>
                        <div className="space-y-2">
                          {highRiskAlerts.map((alert) => (
                            <div
                              key={alert.id}
                              className="p-3 bg-red-50 border border-red-200 rounded-lg"
                            >
                              <p className="text-sm font-medium text-red-900">
                                {alert.name}
                              </p>
                              <p className="text-xs text-red-700 mt-1">
                                Risk Level: {alert.risk}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {alert.timestamp}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Contacts */}
                    {newContacts.length > 0 && (
                      <div className="p-4">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                          New Emergency Contacts
                        </p>
                        <div className="space-y-2">
                          {newContacts.map((contact) => (
                            <div
                              key={contact.id}
                              className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                            >
                              <p className="text-sm font-medium text-blue-900">
                                {contact.name}
                              </p>
                              <p className="text-xs text-blue-700 mt-1">
                                {contact.relationship}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Added {contact.added}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-40 bg-gray-200 rounded-2xl"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      ) : (
        <>
          {isEmergencyActive && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-900 mb-1">
                  EMERGENCY MODE ACTIVE
                </h2>
                <p className="text-red-800 text-sm mb-3">
                  An emergency has been triggered. Please attempt to contact the person
                  immediately.
                </p>
                <div className="flex gap-3">
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                    <Phone className="w-4 h-4" /> Contact Now
                  </button>
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                    View Location
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Wellness Trends (Last 7 Days)
              </h2>
              <div className="h-64 w-full">
                {moodData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={moodData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E5E7EB"
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 12,
                          fill: '#6B7280',
                        }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 12,
                          fill: '#6B7280',
                        }}
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        formatter={(value) => [value, 'Wellness Score']}
                      />
                      <Area
                        type="monotone"
                        dataKey="mood"
                        stroke="#10B981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorMood)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Last active:{' '}
                  <span className="font-medium text-gray-900">Today, 2:30 PM</span>
                </p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{' '}
                  Active recently
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Status
                  </h2>
                </div>
                <p className="text-sm text-gray-500">No alerts at this time.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Wellness Goals
              </h2>
              <div className="space-y-3">
                {goals.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {g.title}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        g.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {g.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Emergency Contacts
                </h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                You are monitoring their wellness status.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Primary Contact
                    </p>
                    <p className="text-xs text-gray-500">Connected</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
        </div>
      </div>
    </div>
  )
}

export default GuardianDashboardPage
