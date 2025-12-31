import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Login, Signup, ForgotPassword, Dashboard, ProfileSetup, ProfileEdit, AvailabilitySetup, MyBookings, AdminPanel } from "./pages"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import { useAuth } from "./context/AuthContext"
import { Toaster } from "@/components/ui/sonner"

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

function PublicRoute({ children }) {
  const { currentUser, profileComplete, checkingProfile } = useAuth()
  
  if (currentUser) {
    if (currentUser.email === ADMIN_EMAIL) {
      return <Navigate to="/admin" replace />
    }
    
    if (checkingProfile) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-customGreen mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading...</p>
          </div>
        </div>
      )
    }
    return <Navigate to={profileComplete ? "/dashboard" : "/profile-setup"} replace />
  }
  
  return children
}

// Admin-only route - only accessible by admin email
function AdminRoute({ children }) {
  const { currentUser, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-customGreen mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  
  if (currentUser.email !== ADMIN_EMAIL) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/profile-setup" element={<ProtectedRoute requireProfile={false}><ProfileSetup /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
          <Route path="/availability" element={<ProtectedRoute><AvailabilitySetup /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

export default App
