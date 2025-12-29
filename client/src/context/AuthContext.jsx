import { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import { psychologistService } from '@/services/psychologistService';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);

  const checkProfileStatus = async (user) => {
    if (!user) {
      setProfileComplete(false);
      setCheckingProfile(false);
      return;
    }

    setCheckingProfile(true);
    try {
      const result = await psychologistService.getProfile(user.uid);
      if (result.success && result.data) {
        setProfileComplete(true);
      } else {
        setProfileComplete(false);
      }
    } catch (error) {
      console.log('Profile not found or error:', error.message);
      setProfileComplete(false);
    } finally {
      setCheckingProfile(false);
    }
  };

  const refreshProfileStatus = async () => {
    if (currentUser) {
      await checkProfileStatus(currentUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await checkProfileStatus(user);
      } else {
        setProfileComplete(false);
        setCheckingProfile(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    profileComplete,
    checkingProfile,
    refreshProfileStatus
  };

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 lassName="animate-spin bg-customGreen h-12 w-12 mx-auto"/>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
