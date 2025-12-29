import { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import { psychologistService } from '@/services/psychologistService';

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
  const [checkingProfile, setCheckingProfile] = useState(true);

  const checkProfileStatus = async (user) => {
    if (!user) {
      setProfileComplete(false);
      setCheckingProfile(false);
      return;
    }

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
      setCheckingProfile(true);
      await checkProfileStatus(currentUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      if (user) {
        await checkProfileStatus(user);
      } else {
        setProfileComplete(false);
        setCheckingProfile(false);
      }
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

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
