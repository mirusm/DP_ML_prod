import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from 'firebase/auth';
import { auth } from './firebase/firebase';

const Sidebar = () => {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

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
    <aside className="w-64 bg-blue-600 text-white p-4 flex flex-col space-y-4 fixed h-screen">
      <div className="flex justify-center mb-6">
        <span className="text-lg font-bold">TP15</span>
      </div>
      <nav className="flex flex-col space-y-4">
        <Link to="/dashboard" className="flex items-center space-x-2 p-2 hover:bg-blue-700 rounded">
          <img src="/dashboard-icon.png" alt="Dashboard Icon" className="h-6 w-6" />
          <span className="text-white">Dashboard</span>
        </Link>
        <Link to="/new-prediction" className="flex items-center space-x-2 p-2 hover:bg-blue-700 rounded">
          <img src="/new-prediction-icon.png" alt="Prediction Icon" className="h-6 w-6" />
          <span className="text-white">New prediction</span>
        </Link>
        <Link to="/my-predictions" className="flex items-center space-x-2 p-2 hover:bg-blue-700 rounded">
          <img src="/my-predictions-icon.png" alt="Predictions Icon" className="h-6 w-6" />
          <span className="text-white">My predictions</span>
        </Link>
        <Link to="/tooltip" className="flex items-center space-x-2 p-2 hover:bg-blue-700 rounded">
          <img src="/tooltip-icon.png" alt="Tooltip Icon" className="h-6 w-6" />
          <span className="text-white">Tooltip</span>
        </Link>
      </nav>
      <div className="mt-auto">
        <div className="text-sm text-white mb-2">
          {currentUser?.email}
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center space-x-2 p-2 hover:bg-blue-700 rounded w-full"
        >
          <img src="/logout-icon.png" alt="Logout Icon" className="h-6 w-6" />
          <span className="text-white">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;