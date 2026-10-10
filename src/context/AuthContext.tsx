import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  handleFirestoreError,
  OperationType,
} from '../services/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  deleteUserAccountData: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'arpitsharma1124@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    const profileRef = doc(db, 'users', currentUser.uid);
    try {
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        const initialProfile: UserProfile = {
          id: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || 'Aspiring Engineer',
          college: '',
          degree: 'B.Tech',
          branch: 'Computer Science and Engineering',
          graduationYear: '2026',
          targetRole: 'Software Development Engineer',
          currentSkills: ['C++', 'Data Structures', 'SQL'],
          dailyStudyHours: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(profileRef, initialProfile);
        setUserProfile(initialProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await fetchProfile(currentUser);
        } catch (e) {
          console.error('Failed to load profile:', e);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await fetchProfile(result.user);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    const updated = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    try {
      await updateDoc(profileRef, updated);
      setUserProfile((prev) => (prev ? { ...prev, ...updated } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const deleteUserAccountData = async () => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    try {
      await deleteDoc(profileRef);
      setUserProfile(null);
      await signOut(auth);
      setUser(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}`);
    }
  };

  const isAdmin = Boolean(user && user.email === ADMIN_EMAIL);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        signInWithGoogle,
        logout,
        updateUserProfile,
        deleteUserAccountData,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
