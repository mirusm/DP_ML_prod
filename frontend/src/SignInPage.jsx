import React, { useState } from "react";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL  || 'http://127.0.0.1:8000/api'; // Fallback for local development


  const handleSignIn = async (e) => {
    e.preventDefault(); 
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; 

      const response = await fetch(`${API_URL}/get_user_info/`, {
        method: 'GET',
        headers: {
          'Email': email 
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user information');
      }

      const userInfo = await response.json();
      localStorage.setItem('userId', userInfo.id);

      console.log('User Info:', userInfo); 

      navigate('/dashboard');
    } catch (err) {
      console.error("Sign in error:", err);
      setError(err.message || "Failed to sign in");
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
              className="w-full p-4 bg-blue-600 text-white rounded text-lg hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
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
            <a href="/forgot-password" className="text-blue-600 hover:underline">Forgot password?</a>
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