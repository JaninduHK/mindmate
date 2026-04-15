import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { EmergencyProvider } from './context/EmergencyContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import EmergencyModeBanner from './components/emergency/EmergencyModeBanner';

import Home from './pages/Home';
import Login from './pages/Login';
import GuardianLogin from './pages/GuardianLogin';
import GuardianSignup from './pages/GuardianSignup';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GuardianDashboard from './pages/GuardianDashboard';
import Profile from './pages/Profile';
import ContentLibrary from './pages/ContentLibrary';
import EmergencyContacts from './pages/EmergencyContacts';
import NotFound from './pages/NotFound';
import ChatPage from './pages/chat/ChatPage';

// Crisis System Pages
import EmergencyContactsPage from './pages/emergency/contacts/EmergencyContactsPage';
import ContentLibraryPage from './pages/emergency/content/ContentLibraryPage';
import NotificationsPage from './pages/emergency/notifications/NotificationsPage';
import ProfileSettingsPage from './pages/emergency/settings/ProfileSettingsPage';
import InvitationAcceptPage from './pages/emergency/invitation/InvitationAcceptPage';
import GuardianDashboardPage from './pages/emergency/guardian/GuardianDashboardPage';

// Events
import EventList from './pages/Events/EventList';
import EventDetail from './pages/Events/EventDetail';

// Counselors (public)
import CounselorList from './pages/Counselors/CounselorList';
import CounselorProfile from './pages/Counselors/CounselorProfile';

// Booking
import BookingCheckout from './pages/Booking/BookingCheckout';
import BookingConfirmation from './pages/Booking/BookingConfirmation';
import MyBookings from './pages/Booking/MyBookings';

// Counselor role pages
import CounselorOnboarding from './pages/Counselor/CounselorOnboarding';
import CounselorDashboard from './pages/Counselor/CounselorDashboard';
import EventCreate from './pages/Counselor/EventCreate';
import EventManage from './pages/Counselor/EventManage';
import CounselorAnalytics from './pages/Counselor/CounselorAnalytics';

// Admin pages
import AdminDashboard from './pages/Admin/AdminDashboard';

// Counselor withdrawals
import CounselorWithdrawals from './pages/Counselor/CounselorWithdrawals';

// Peer Supporter pages
import PeerSupporterRegister from './pages/PeerSupporter/PeerSupporterRegister';
import PeerSupporterDashboard from './pages/PeerSupporter/PeerSupporterDashboard';
import PeerSupporterList from './pages/PeerSupporter/PeerSupporterList';
import UsersList from './pages/PeerSupporter/UsersList';

import PersonalTrackingPage from './pages/PersonalTracking/PersonalTrackingPage';
import { useAuth } from './hooks/useAuth';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EmergencyProvider>
          <AppContent />
        </EmergencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { background: '#363636', color: '#fff' },
                success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
                error: { duration: 4000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
            {user?.role !== 'emergency_contact' && <EmergencyModeBanner />}
            {user?.role !== 'emergency_contact' && <Header />}
            <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/guardian-login" element={<GuardianLogin />} />
              <Route path="/guardian-signup/:token" element={<GuardianSignup />} />
              <Route path="/register/guardian" element={<GuardianSignup />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/peer-supporter" element={<PeerSupporterRegister />} />
              <Route path="/invitation/:token" element={<InvitationAcceptPage />} />
              <Route path="/events" element={<EventList />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/counselors" element={<CounselorList />} />
              <Route path="/counselors/:id" element={<CounselorProfile />} />
              <Route path="/peer-supporters" element={<PeerSupporterList />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chat/:recipientId" element={<ChatPage />} />
              {/* Protected — user role only */}
              <Route element={<ProtectedRoute allowedRoles={['user']} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/emergency-contacts" element={<EmergencyContacts />} />
                <Route path="/content-library" element={<ContentLibrary />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile/settings" element={<ProfileSettingsPage />} />
              </Route>

              {/* Protected — user + admin */}
              <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
                <Route path="/personal-tracking" element={<PersonalTrackingPage />} />
              </Route>

              {/* Protected — any authenticated user */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/booking/checkout/:eventId" element={<BookingCheckout />} />
                <Route path="/booking/confirmation/:bookingId" element={<BookingConfirmation />} />
                <Route path="/booking/my" element={<MyBookings />} />
                <Route path="/counselor/onboarding" element={<CounselorOnboarding />} />
              </Route>

              {/* Protected — peer supporter role */}
              <Route element={<ProtectedRoute allowedRoles={['peer_supporter']} />}>
                <Route path="/peer-supporter/dashboard" element={<PeerSupporterDashboard />} />
                <Route path="/peer-supporter/users" element={<UsersList />} />
              </Route>

              {/* Protected — counselor role */}
              <Route element={<ProtectedRoute allowedRoles={['counselor']} />}>
                <Route path="/counselor/dashboard" element={<CounselorDashboard />} />
                <Route path="/counselor/events" element={<EventManage />} />
                <Route path="/counselor/events/create" element={<EventCreate />} />
                <Route path="/counselor/analytics" element={<CounselorAnalytics />} />
                <Route path="/counselor/withdrawals" element={<CounselorWithdrawals />} />
              </Route>

              {/* Protected — admin role */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Route>

              {/* Protected — emergency_contact role (guardians) */}
              <Route element={<ProtectedRoute allowedRoles={['emergency_contact']} />}>
                <Route path="/guardian-dashboard" element={<GuardianDashboard />} />
                <Route path="/guardian/dashboard" element={<GuardianDashboard />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          {user?.role !== 'emergency_contact' && <Footer />}
        </div>
      );
    }

export default App;
