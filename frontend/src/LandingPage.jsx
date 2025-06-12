import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

const LandingPage = () => {
  const { currentUser, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && location.pathname === '/') {
      logout()
        .then(() => console.log("Logout successful..."))
        .catch((error) => console.error("Logout error:", error));
    }
  }, [currentUser, logout]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center container mx-auto">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <a href="/">
            <img
              src="/tp25-logo.png"
              alt="TP15 Logo"
              className="h-8 sm:h-10 w-auto"
            />
          </a>
          <a href="/" className="text-lg sm:text-xl font-bold text-gray-800">
            QSAR Tool
          </a>
        </div>
        <nav className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Link
            to="/"
            className="text-blue-800 text-sm sm:text-base font-bold px-2 py-1 rounded-md transition-colors duration-200 ease-in-out hover:bg-blue-800 hover:text-white w-full sm:w-auto text-center"
          >
            Home
          </Link>
          <a
            href="http://147.175.151.128/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-800 text-sm sm:text-base font-bold px-2 py-1 rounded-md transition-colors duration-200 ease-in-out hover:bg-blue-800 hover:text-white w-full sm:w-auto text-center"
          >
            Project
          </a>
          <Link
            to="/sign-in"
            className="text-blue-800 text-sm sm:text-base font-bold px-2 py-1 rounded-md transition-colors duration-200 ease-in-out hover:bg-blue-800 hover:text-white w-full sm:w-auto text-center"
          >
            Login →
          </Link>
        </nav>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
        <div className="flex flex-col lg:flex-row items-center container mx-auto gap-6 lg:gap-12">
          <div className="w-full lg:w-1/2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-gray-800">
              ML-Powered <span className="text-blue-600">QSAR</span> Web Tool for Predicting ALR1
              & ALR2 Inhibiting Efficacy
            </h1>
            <p className="text-gray-700 text-sm sm:text-base mb-6 leading-relaxed">
              Our ML-Powered QSAR Web Tool leverages machine learning models to predict the
              inhibitor efficacy of ALR1 and ALR2.
            </p>
            <Link to="/sign-in">
              <button className="bg-blue-600 cursor-pointer text-white px-4 sm:px-6 py-2 sm:py-3 rounded text-base sm:text-lg hover:bg-blue-700 transition duration-300">
                Enter app
              </button>
            </Link>
          </div>

          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <img
              src="/landing-page.png"
              alt="QSAR Tool Illustration"
              className="max-w-full h-auto w-full sm:w-3/4 lg:w-full"
            />
          </div>
        </div>
      </main>

      <footer className="bg-blue-600 text-white py-3 sm:py-4 text-[10px] sm:text-xs font-bold">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex flex-col items-start mb-3 sm:mb-0">
            <img
              src="/plan_obnovy.jpg"
              alt="Plan obnovy logo"
              className="h-8 sm:h-10 w-auto mb-2"
            />
            <p className="text-[10px] sm:text-xs">
              Názov projektu: Verejná platforma na predikciu toxických látok
            </p>
            <p className="text-[10px] sm:text-xs">
              Kód projektu: 09I05-03-V02-00048
            </p>
          </div>
          <p className="text-[10px] sm:text-xs text-center sm:text-right">
            © 2025 TP15 - DIACOMP. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;