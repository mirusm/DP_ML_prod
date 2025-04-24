import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error("Sign up error:", err);
      let errorMessage = "Failed to create account. Please try again.";
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = "Email is already registered.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "Password is too weak.";
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
          <h1 className="text-4xl font-bold mb-6 text-blue-600 text-center">Create Account</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">
            Already have an account? <Link to="/sign-in" className="text-blue-600 hover:underline">Sign in</Link>
          </p>
          <form onSubmit={handleSignUp}>
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
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
              className="w-full p-4 mb-4 border border-gray-300 rounded text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full p-4 bg-blue-600 text-white rounded text-lg hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 cursor-pointer"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
          {error && (
            <p className="text-red-500 text-sm mt-4 text-center">
              {error}
            </p>
          )}
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

export default SignUpPage;