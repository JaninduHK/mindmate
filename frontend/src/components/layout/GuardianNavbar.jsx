import React from 'react'
import { LogOut, Shield } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export const GuardianNavbar = ({ monitoredUserName }) => {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      navigate('/guardian-login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: MindMate Logo - Blue Color */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-600">MindMate</span>
          </div>

          {/* Middle: Guardian Dashboard Title */}
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900">
              Guardian Dashboard
            </h1>
            {monitoredUserName && (
              <p className="text-sm text-gray-500">Monitoring {monitoredUserName}</p>
            )}
          </div>

          {/* Right: Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default GuardianNavbar
