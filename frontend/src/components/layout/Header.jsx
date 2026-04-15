import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import NotificationBell from '../notifications/NotificationBell';
import EmergencyButton from '../emergency/emergency/EmergencyButton.jsx';
import { FiUser, FiLogOut, FiMenu } from 'react-icons/fi';
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

  return (
    <header className="bg-white shadow-sm">
      <nav className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">MindMate</span>
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
                {user?.role === 'user' && (
                  <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors text-sm">
                    Dashboard
                  </Link>
                )}

                {isEmergencyContact && (
                  <Link to="/guardian/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors text-sm">
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
                  {/* Emergency button for regular users */}
                  {user?.role === 'user' && (
                    <EmergencyButton />
                  )}
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
            <Link to="/events" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>Events</Link>
            <Link to="/counselors" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>Counselors</Link>

            {isAuthenticated ? (
              <>
                {user?.role === 'user' && (
                  <Link to="/dashboard" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>Dashboard</Link>
                )}

                {isEmergencyContact && (
                  <Link to="/guardian/dashboard" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>Dashboard</Link>
                )}

                {isCounselor && (
                  <Link to="/counselor/dashboard" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>My Studio</Link>
                )}
                {isPeerSupporter && (
                  <Link to="/peer-supporter/dashboard" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>Support Hub</Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>Admin</Link>
                )}

                {user?.role === 'user' && (
                  <Link to="/emergency-contacts" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>Emergency Contacts</Link>
                )}

                {!isAdmin && (
                  <Link to="/booking/my" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>My Bookings</Link>
                )}
                <Link to="/profile" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>Profile</Link>
                <button
                  onClick={() => { handleLogout(); setShowMenu(false); }}
                  className="w-full text-left py-2 text-gray-700 hover:text-primary-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>Login</Link>
                <Link to="/register" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setShowMenu(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
