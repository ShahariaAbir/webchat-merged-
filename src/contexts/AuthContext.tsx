import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  signup: (email: string, password: string) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function signup(email: string, password: string) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(user);
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: email.split('@')[0],
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      online: true
    });
  }

  async function signin(email: string, password: string) {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    
    if (!user.emailVerified) {
      await signOut(auth);
      throw new Error('Please verify your email before signing in.');
    }

    // Update user's online status and last seen
    await updateDoc(doc(db, 'users', user.uid), {
      lastSeen: new Date().toISOString(),
      online: true
    });

    return user;
  }

  async function signout() {
    if (currentUser) {
      // Update user's online status before signing out
      await updateDoc(doc(db, 'users', currentUser.uid), {
        lastSeen: new Date().toISOString(),
        online: false
      });
    }
    return signOut(auth);
  }

  function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (!user.displayName && userData.displayName) {
              user.displayName = userData.displayName;
            }
            // Update online status when user is authenticated
            await updateDoc(doc(db, 'users', user.uid), {
              online: true,
              lastSeen: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error updating user status:', error);
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup function to handle user going offline
    return () => {
      if (currentUser) {
        updateDoc(doc(db, 'users', currentUser.uid), {
          online: false,
          lastSeen: new Date().toISOString()
        }).catch(console.error);
      }
      unsubscribe();
    };
  }, [currentUser]);

  const value = {
    currentUser,
    signup,
    signin,
    signout,
    resetPassword,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}