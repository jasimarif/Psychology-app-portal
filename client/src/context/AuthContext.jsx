import { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import { psychologistService } from '@/services/psychologistService';
import { BriefcaseIcon } from '@/components/icons/DuoTuneIcons';

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
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-customGreen/5 via-white to-customGreen/5">
        <div className="text-center">
          <BriefcaseIcon className="h-16 w-16 mx-auto text-customGreen animate-pulse" style={{
            animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}/>
          <p className="mt-4 text-customGreen text-xl font-bold font-nunito">Please wait</p>
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
