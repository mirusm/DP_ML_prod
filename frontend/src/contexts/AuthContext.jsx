import React, { createContext, useContext, useState, useEffect } from "react";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        let retries = 3;
        let delay = 2000;

        const attemptTokenRefresh = async (attempt = 1) => {
          try {
            const token = await user.getIdToken(true);
            localStorage.setItem("firebaseToken", token);
            localStorage.setItem("userId", user.uid);

            try {
              const userRef = doc(db, "users", user.uid);
              await setDoc(
                userRef,
                {
                  email: user.email,
                  createdAt: new Date().toISOString(),
                },
                { merge: true }
              );
            } catch (firestoreError) {
              console.warn("Failed to initialize Firestore document:", firestoreError);
            }

            setCurrentUser(user);
            setAuthError(null);
          } catch (error) {
            console.error(`Token refresh attempt ${attempt} failed:`, error);
            if (attempt < retries && error.code !== "auth/user-disabled") {
              await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
              return attemptTokenRefresh(attempt + 1);
            }

            setAuthError(error.message);
            if (
              error.code === "auth/network-request-failed" ||
              error.code === "auth/too-many-requests"
            ) {
              await signOut(auth).catch((err) => console.error("Sign out error:", err));
              setCurrentUser(null);
              localStorage.removeItem("firebaseToken");
              localStorage.removeItem("userId");
            } else {
              setCurrentUser(user);
            }
          } finally {
            setLoading(false);
          }
        };

        await attemptTokenRefresh();
      } else {
        setCurrentUser(null);
        setAuthError(null);
        localStorage.removeItem("firebaseToken");
        localStorage.removeItem("userId");
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("firebaseToken");
      localStorage.removeItem("userId");
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    authError,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}