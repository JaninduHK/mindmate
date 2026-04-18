import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import NotificationBell from '../notifications/NotificationBell';
import EmergencyButton from '../emergency/emergency/EmergencyButton.jsx';
import { FiUser, FiLogOut, FiMenu, FiAlertTriangle } from 'react-icons/fi';
import { useState } from 'react';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isCounselor = user?.role === 'counselor';
  const isAdmin = user?.role === 'admin';
  const isPeerSupporter = user?.role === 'peer_supporter';
  const isEmergencyContact = user?.role === 'emergency_contact';
  const isUserRole = user?.role === 'user';

  // Check if any monitored user is in emergency mode (for guardians)
  const isMonitoredUserInEmergency = localStorage.getItem('monitoredUserEmergency') === 'true';

  // Guardian navbar - simplified version
  if (isEmergencyContact) {
    return (
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <nav className="container-custom py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo + MindMate */}
            <Link to="/guardian/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-blue-600">MindMate</span>
            </Link>

            {/* Middle: Guardian Dashboard Title */}
            <div className="flex-1 text-center">
              <span className="text-lg font-semibold text-gray-900">Guardian Dashboard</span>
              {isMonitoredUserInEmergency && (
                <div className="flex items-center justify-center gap-1 mt-1 text-red-600">
                  <FiAlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-semibold">EMERGENCY MODE ACTIVE</span>
                </div>
              )}
            </div>

            {/* Right: Logout */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-1"
            >
              <FiLogOut />
              <span>Logout</span>
            </Button>
          </div>
        </nav>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-sm relative">
      {/* Emergency Button - Top Right Corner */}
      {isAuthenticated && isUserRole && (
        <div className="absolute top-4 right-12">
          <EmergencyButton />
        </div>
      )}

      <nav className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/">
            <img src="/src/assets/MindMate Logo.png" alt="MindMate" className="h-10" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/events" className="text-gray-700 hover:text-primary-600 transition-colors text-sm">
              Events
            </Link>
            <Link to="/counselors" className="text-gray-700 hover:text-primary-600 transition-colors text-sm">
              Counselors
            </Link>

            {isAuthenticated ? (
              <>
                {isUserRole && (
                  <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors text-sm">
                    Dashboard
                  </Link>
                )}

                {isCounselor && (
                  <Link to="/counselor/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors text-sm">
                    My Studio
                  </Link>
                )}

                {isPeerSupporter && (
                  <Link to="/peer-supporter/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors text-sm">
                    Support Hub
                  </Link>
                )}

                {isAdmin && (
                  <Link to="/admin" className="text-gray-700 hover:text-primary-600 transition-colors text-sm font-semibold">
                    Admin
                  </Link>
                )}

                <NotificationBell />

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1"
                  >
                    <FiLogOut />
                    <span>Logout</span>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="secondary" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setShowMenu(!showMenu)}>
            <FiMenu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden mt-4 pb-4 space-y-2">
            <Link to="/events" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>
              Events
            </Link>
            <Link to="/counselors" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>
              Counselors
            </Link>

            {isAuthenticated ? (
              <>
                {isUserRole && (
                  <Link to="/dashboard" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>
                    Dashboard
                  </Link>
                )}

                {isCounselor && (
                  <Link to="/counselor/dashboard" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>
                    My Studio
                  </Link>
                )}

                {isPeerSupporter && (
                  <Link to="/peer-supporter/dashboard" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>
                    Support Hub
                  </Link>
                )}

                {isAdmin && (
                  <Link to="/admin" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>
                    Admin
                  </Link>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-1 mt-2"
                >
                  <FiLogOut />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2" onClick={() => setShowMenu(false)}>
                  <Button variant="secondary" size="sm" className="w-full">Login</Button>
                </Link>
                <Link to="/register" className="block py-2" onClick={() => setShowMenu(false)}>
                  <Button variant="primary" size="sm" className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
