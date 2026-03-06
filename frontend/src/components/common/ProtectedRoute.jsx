import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from './Loading';

const getDashboardByRole = (role) => {
  if (role === 'peer_supporter') return '/peer-supporter/dashboard';
  if (role === 'counselor') return '/counselor/dashboard';
  if (role === 'admin') return '/admin';
  return '/dashboard';
};

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <Loading fullScreen size="lg" />;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getDashboardByRole(user?.role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
