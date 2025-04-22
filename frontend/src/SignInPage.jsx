import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && currentUser) {
      console.log("User already logged in, redirecting...");
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      let errorMessage = "Failed to sign in. Please try again.";
      if (err.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 flex items-center justify-center bg-white p-8 relative">
        <div className="text-white">
          <button
            onClick={handleBackToLanding}
            className="absolute top-4 left-4 hover:underline text-current focus:outline-none"
          >
            ← Back
          </button>
        </div>
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold mb-6 text-blue-600 text-center">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">
            New to app? <Link to="/sign-up" className="text-blue-600 hover:underline">Create an account</Link>
          </p>
          <form onSubmit={handleSignIn}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full p-4 mb-4 border border-gray-300 rounded text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full p-4 mb-4 border border-gray-300 rounded text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full p-4 bg-blue-600 text-white rounded text-lg hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          {error && (
            <p className="text-red-500 text-sm mt-4 text-center">
              {error}
            </p>
          )}
          <p className="text-gray-500 text-sm mt-4 text-center">
            <Link to="/forgot-password" className="text-blue-600 hover:underline">Forgot password?</Link>
          </p>
        </div>
      </div>
      <div
        className="w-1/2 bg-cover bg-center"
        style={{ backgroundImage: 'url(/sign-in.jpg)' }}
      >
        <div className="h-full w-full bg-black opacity-50"></div>
      </div>
    </div>
  );
};

export default SignInPage;