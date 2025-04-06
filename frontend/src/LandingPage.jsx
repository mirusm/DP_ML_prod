import React from 'react';
import { Link } from 'react-router-dom'; 

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="p-4 flex justify-between items-center container mx-auto">
        <div className="flex items-center space-x-2">
          <img src="/tp25-logo.png" alt="TP15" className="h-10 w-10" />
        </div>
        <nav className="space-x-6 font-bold">
          <Link to="/" className="text-blue-800 hover:underline text-base font-bold px-2 py-1">
            Home
          </Link>
          <a
            href="http://147.175.151.128/"
            className="text-blue-800 hover:underline text-base font-bold px-2 py-1"
          >
            Project
          </a>
          <Link to="/sign-in" className="text-blue-800 hover:underline text-base font-bold px-2 py-1">
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
              <button className="bg-blue-600 text-white px-6 py-3 rounded text-lg hover:bg-blue-700 transition duration-300">
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