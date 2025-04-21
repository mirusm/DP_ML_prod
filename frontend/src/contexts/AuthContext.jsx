import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      localStorage.removeItem("userId")
      console.log("Auth state changed:", user ? `User UID: ${user.uid}` : "No user");
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = () => {
    try {
      if (!auth) {
        console.error("Cannot logout: Firebase auth object is missing!");
        return Promise.reject(new Error("Firebase auth object is missing!"));
      }
      console.log("Logging out...");
      return signOut(auth);
    } catch (error) {
       console.error("Error caught within logout function:", error);
       return Promise.reject(error);
    }
  };

  const value = {
    currentUser,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}