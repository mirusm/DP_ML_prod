import React, { useState } from "react";
import { useSendPasswordResetEmail } from 'react-firebase-hooks/auth';
import { auth } from './firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [sendPasswordResetEmail, sending, error] = useSendPasswordResetEmail(auth);
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    try {
      await sendPasswordResetEmail(email);
      toast.success('Password reset email sent');
      navigate('/sign-in');
    } catch (e) {
      toast.error('Error sending password reset email');
      console.error(e);
    }
  };

  const handleBackToSignIn = () => {
    navigate('/sign-in');
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 flex items-center justify-center bg-white p-8 relative">
        <div className="text-white">
          <button
            onClick={handleBackToSignIn}
            className="absolute top-4 left-4 hover:underline text-current focus:outline-none"
          >
            ← Back
          </button>
        </div>

        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold mb-6 text-blue-600 text-center">Forgot password</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">Enter your email to reset your password</p>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-4 mb-4 border border-gray-300 rounded text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleForgotPassword}
            className="w-full p-4 bg-blue-600 text-white rounded text-lg hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {sending ? "Sending Reset email..." : "Send reset email"}
          </button>
          {error && (
            <p className="text-red-500 text-sm mt-4 text-center">
              {error.message}
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

export default ForgotPasswordPage;