import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { signOut } from 'firebase/auth';
import { auth } from './firebase/firebase';
import { Info, ChartScatter, Monitor, Microscope, LogOut, Moon } from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
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
    <aside className="dark:bg-gray-100 w-64 bg-blue-600 text-white p-4 flex flex-col space-y-4 fixed h-screen">
      <div className="flex items-center space-x-3 pt-3 pl-2 mb-10">
        <div className="w-9 h-9 bg-white text-blue-600 rounded-full flex items-center justify-center text-lg font-bold">
          {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'X'}
        </div>
        <div>
          <div className="text-sm font-bold">
            Welcome
          </div>
          <div className="text-xs text-blue-200">
          {currentUser?.email}
          </div>
        </div>
      </div>

      <nav className="flex flex-col space-y-4">
        <Link to="/dashboard" className="flex items-center space-x-2 p-2 hover:bg-blue-700 rounded">
          <Monitor className="h-6 w-6 text-white" />
          <span className="text-white">Dashboard</span>
        </Link>

        <Link to="/new-prediction" className="flex items-center space-x-2 p-2 hover:bg-blue-700 rounded">
          <Microscope className="h-6 w-6 text-white" />
          <span className="text-white">New prediction</span>
        </Link>

        <Link to="/my-predictions" className="flex items-center space-x-2 p-2 hover:bg-blue-700 rounded">
          <ChartScatter className="h-6 w-6 text-white" />
          <span className="text-white">My predictions</span>
        </Link>

        <Link to="/tooltip" className="flex items-center space-x-2 p-2 hover:bg-blue-700 rounded">
          <Info className="h-6 w-6 text-white" />
          <span className="text-white">Tooltip</span>
        </Link>
      </nav>

      <div className="mt-auto space-y-4">
        <div className="flex items-center justify-between p-2 hover:bg-blue-700 dark:hover:bg-gray-800 rounded cursor-pointer">
          <div className="flex items-center space-x-2">
            <Moon className="h-6 w-6 text-white dark:text-gray-200" />
            <span className="text-white dark:text-gray-200">Dark mode</span>
          </div>
          <label htmlFor="darkModeToggle" className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              id="darkModeToggle"
              type="checkbox"
              className="sr-only"
              checked={isDarkMode}
              onChange={toggleDarkMode}
            />
            <div className={`block w-10 h-6 rounded-full transition ${isDarkMode ? 'bg-blue-400' : 'bg-gray-500'}`}></div> 
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${isDarkMode ? 'bg-blue-600 translate-x-full' : 'bg-gray-500'}`}></div>
          </div>
        </label>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 p-2 hover:bg-blue-700 rounded w-full cursor-pointer"
        >
          <LogOut className="h-6 w-6 text-white" />
          <span className="text-white">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;