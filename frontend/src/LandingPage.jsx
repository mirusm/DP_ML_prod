import React, { useEffect } from 'react'; // <--- Import useEffect
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'; // <--- Import useAuth

const LandingPage = () => {
  const { currentUser, logout, loading } = useAuth();

  useEffect(() => {
    if (currentUser && location.pathname === '/') {
      console.log("User detected on Landing Page ('/'). Logging out...");
      logout()
        .then(() => console.log("Logout successful..."))
        .catch((error) => console.error("Logout error:", error));
    }
  }, [currentUser, location.pathname, logout]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="pt-4 pr-4 pb-4 flex justify-between items-center container mx-auto">
        <div className="flex items-center space-x-2">
          <a href="/">
            <img src="/tp25-logo.png" alt="TP15" className="h-10 w-10" />
          </a>
          <a href="/" className="font-bold text-lg">
            QSAR Tool 
          </a>
        </div>
        <nav className="space-x-6 font-bold">
          <Link
            to="/"
            className="text-blue-800 text-base font-bold px-2 py-1 rounded-md transition-colors duration-200 ease-in-out hover:bg-blue-800 hover:text-white"
          >
            Home
          </Link>
          <a
            href="http://147.175.151.128/"
            target="_blank"
            className="text-blue-800 text-base font-bold px-2 py-1 rounded-md transition-colors duration-200 ease-in-out hover:bg-blue-800 hover:text-white"
          >
            Project
          </a>
          <Link
            to="/sign-in"
            className="text-blue-800 text-base font-bold px-2 py-1 rounded-md transition-colors duration-200 ease-in-out hover:bg-blue-800 hover:text-white"
          >
            Login →
          </Link>
        </nav>
      </header>

      <main className="flex-grow flex items-center justify-center p-8">
        <div className="flex items-center container mx-auto">
          <div className="w-1/2 hero-container">
            <h1 className="text-4xl font-bold mb-4">
              ML-Powered <span className="text-blue-600">QSAR</span> Web Tool for Predicting ALR1 & ALR2 Inhibiting Efficacy
            </h1>
            <p className="text-gray-700 mb-6">
              Our ML-Powered QSAR Web Tool leverages machine learning models to predict the inhibitor efficacy of ALR1 and ALR2.
            </p>
            <Link to="/sign-in">
              <button className="bg-blue-600 cursor-pointer text-white px-6 py-3 rounded text-lg hover:bg-blue-700 transition duration-300">
                Enter app
              </button>
            </Link>
          </div>

          <div className="w-1/2 flex justify-end">
            <div className="flex items-center space-x-4">
              <img src='/landing-page.png' alt="Doctor" className="h-129" /> 
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-600 text-white text-center py-4 text-sm font-bold">
      © 2025 TP15 - DIACOMP. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;