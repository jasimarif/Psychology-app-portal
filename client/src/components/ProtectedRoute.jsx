import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

const ProtectedRoute = ({ children, requireProfile = true }) => {
  const { currentUser, loading, profileComplete, checkingProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-customGreen mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to verify-email if email is not verified
  if (!currentUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (currentUser.email === ADMIN_EMAIL) {
    return <Navigate to="/admin" replace />;
  }

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-customGreen mx-auto"></div>
          <p className="mt-4 text-gray-500">Checking profile...</p>
        </div>
      </div>
    );
  }

  if (requireProfile && !profileComplete && location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />;
  }

  if (profileComplete && location.pathname === '/profile-setup') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
