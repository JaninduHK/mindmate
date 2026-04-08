import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import ChatPage from './pages/chat/ChatPage';

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
import ManageAvailability from './pages/PeerSupporter/ManageAvailability';
import PeerSupporterList from './pages/PeerSupporter/PeerSupporterList';
import UsersList from './pages/PeerSupporter/UsersList';

// Personal tracking
import PersonalTrackingPage from './pages/PersonalTracking/PersonalTrackingPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          <Header />
          <main className="flex-1">
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/peer-supporter" element={<PeerSupporterRegister />} />
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
                <Route path="/peer-supporter/manage-availability" element={<ManageAvailability />} />
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

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
