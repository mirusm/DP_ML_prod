import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth } from './firebase/firebase';

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;
  const API_URL = import.meta.env.VITE_API_URL  || 'http://127.0.0.1:8000/api';
  const previousPage = location.state?.from || "/";

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const email = currentUser?.email;

      if (!userId || !email) {
        toast.error("Please log in to view your profile");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/get_user_info/`, {
        headers: {
          "User-Id": userId,
          "Email": email,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user information");
      }

      const data = await response.json();
      setUserInfo(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user info:", error);
      toast.error("Failed to load profile information");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    toast.success("Logged out successfully");
    navigate("/sign-in");
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 ml-64">
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading profile...</p>
          </div>
        </main>
        <ToastContainer closeButton={false}/>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 ml-64">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Profile not available</h2>
          <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
          <Link
            to="/sign-in"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to login
          </Link>
        </main>
        <ToastContainer closeButton={false}/>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 ml-64 overflow-y-auto">
        <h1 className="text-2xl font-bold text-black mb-6">Profile</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">User information</h2>
          <div className="space-y-4 text-black">
            <div>
              <span className="font-semibold">User ID:</span> {userInfo.id || "N/A"}
            </div>
            <div>
              <span className="font-semibold">Email:</span> {userInfo.email || "N/A"}
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-6">
          <Link
            to={previousPage}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back
          </Link>
        </div>
      </main>
      <ToastContainer closeButton={false}/>
    </div>
  );
};

export default ProfilePage;