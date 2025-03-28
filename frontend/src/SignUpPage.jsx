import React, { useState, useEffect } from "react";
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from './firebase/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createUserWithEmailAndPassword, , loadingAuth, errorAuth] = useCreateUserWithEmailAndPassword(auth);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL  || 'http://127.0.0.1:8000/api'; // Fallback for local development

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate('/dashboard');
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSignUp = async () => {
    try {
      const res = await createUserWithEmailAndPassword(email, password);
      if (res?.user) {
        const response = await fetch(`${API_URL}/register/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error('Failed to register user in backend');
        }

        const userInfo = await response.json();
        localStorage.setItem('userId', userInfo.id); 
        sessionStorage.setItem('user', 'true'); 
        setEmail('');
        setPassword('');
        navigate('/dashboard'); 
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loadingAuth) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen">
      <div className="w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold mb-6 text-blue-600 text-center">Create an account</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">
            Already have an account? <Link to="/sign-in" className="text-blue-600 hover:underline">Sign in</Link>
          </p>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-4 mb-4 border border-gray-300 rounded text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-4 mb-4 border border-gray-300 rounded text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSignUp}
            disabled={loadingAuth}
            className="w-full p-4 bg-blue-600 text-white rounded text-lg hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
          >
            {loadingAuth ? "Creating Account..." : "Sign Up"}
          </button>
          {errorAuth && (
            <p className="text-red-500 text-sm mt-4 text-center">
              {errorAuth.message || "Something went wrong. Please try again."}
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
