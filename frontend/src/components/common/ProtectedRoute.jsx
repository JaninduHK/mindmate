import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from './Loading';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <Loading fullScreen size="lg" />;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
