import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { signOut } from 'firebase/auth';
import { auth } from './firebase/firebase';
import { Info, ChartScatter, Monitor, Microscope, LogOut, Moon, X } from "lucide-react";
import { toggleDarkMode, initializeTheme } from './utils/theme';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const [isDarkMode, setIsDarkMode] = useState(initializeTheme());

  useEffect(() => {
    const handleThemeChange = (e) => {
      setIsDarkMode(e.detail.isDark);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  const handleToggleDarkMode = () => {
    toggleDarkMode(!isDarkMode);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('user');
      navigate('/sign-in');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 w-64 h-screen p-4 flex flex-col space-y-4 transition-transform duration-300 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 z-50 ${isDarkMode ? "bg-gray-800 text-white" : "bg-blue-600 text-white"}`}
    >
      <button
        className="md:hidden self-end p-2 rounded-lg text-white"
        onClick={() => setIsOpen(false)}
        aria-label="Close sidebar"
      >
        <X className="h-6 w-6" />
      </button>
      <div className="flex items-center space-x-3 pt-3 pl-2 mb-10">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold ${
            isDarkMode ? "bg-gray-200 text-gray-800" : "bg-white text-blue-600"
          }`}
        >
          {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : "X"}
        </div>
        <div>
          <div className="text-sm font-bold">Welcome</div>
          <div className="text-xs text-blue-200 dark:text-gray-300">
            {currentUser?.email}
          </div>
        </div>
      </div>

      <nav className="flex flex-col space-y-4">
        <Link
          to="/dashboard"
          className={`flex items-center space-x-2 p-2 rounded ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-blue-700"
          }`}
          onClick={() => setIsOpen(false)}
        >
          <Monitor className="h-6 w-6 text-white" />
          <span className="text-white">Dashboard</span>
        </Link>
        <Link
          to="/new-prediction"
          className={`flex items-center space-x-2 p-2 rounded ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-blue-700"
          }`}
          onClick={() => setIsOpen(false)}
        >
          <Microscope className="h-6 w-6 text-white" />
          <span className="text-white">New prediction</span>
        </Link>
        <Link
          to="/my-predictions"
          className={`flex items-center space-x-2 p-2 rounded ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-blue-700"
          }`}
          onClick={() => setIsOpen(false)}
        >
          <ChartScatter className="h-6 w-6 text-white" />
          <span className="text-white">My predictions</span>
        </Link>
        <Link
          to="/about"
          className={`flex items-center space-x-2 p-2 rounded ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-blue-700"
          }`}
          onClick={() => setIsOpen(false)}
        >
          <Info className="h-6 w-6 text-white" />
          <span className="text-white">About Project</span>
        </Link>
      </nav>

      <div className="mt-auto space-y-4">
        <div
          className={`flex items-center justify-between p-2 rounded cursor-pointer ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-blue-700"
          }`}
        >
          <div className="flex items-center space-x-2">
            <Moon
              className={`h-6 w-6 ${isDarkMode ? "text-gray-200" : "text-white"}`}
            />
            <span className={isDarkMode ? "text-gray-200" : "text-white"}>
              Dark mode
            </span>
          </div>
          <label htmlFor="darkModeToggle" className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                id="darkModeToggle"
                type="checkbox"
                className="sr-only"
                checked={isDarkMode}
                onChange={handleToggleDarkMode}
              />
              <div
                className={`block w-10 h-6 rounded-full transition-colors ${
                  isDarkMode ? "bg-blue-400" : "bg-gray-400"
                }`}
              ></div>
              <div
                className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                  isDarkMode ? "bg-blue-600 translate-x-4" : "bg-white translate-x-0"
                }`}
              ></div>
            </div>
          </label>
        </div>

        <button
          onClick={handleLogout}
          className={`flex items-center space-x-2 p-2 rounded w-full cursor-pointer ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-blue-700"
          }`}
        >
          <LogOut className="h-6 w-6 text-white" />
          <span className="text-white">Logout</span>
        </button>
        <div className="flex flex-col items-start pt-2">
          <img
            src="/plan_obnovy.jpg" 
            alt="Plan obnovy logo"
            className="h-6 sm:h-8 w-auto mb-2"
          />
          <p className="text-[10px] sm:text-xs">
            Názov projektu: Verejná platforma na predikciu toxických látok
          </p>
          <p className="text-[10px] sm:text-xs">
            Kód projektu: 09I05-03-V02-00048
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;