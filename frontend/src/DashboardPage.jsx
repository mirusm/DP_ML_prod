import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "./contexts/AuthContext";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "./firebase/firebase";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const handleThemeChange = (e) => {
      setIsDarkMode(e.detail.isDark);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const fetchPredictions = async () => {
    if (!currentUser) {
      setLoading(false);
      navigate('/sign-in', { replace: true });
      return;
    }

    try {
      const predictionsRef = collection(db, `users/${currentUser.uid}/predictions`);
      const q = query(predictionsRef, orderBy('date', 'desc'), limit(8));
      const querySnapshot = await getDocs(q);
      const predictionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPredictions(predictionsData);
      setError(null);
    } catch (error) {
      let errorMessage = 'Failed to load predictions.';
      if (error.message.includes('net::ERR_BLOCKED_BY_CLIENT')) {
        errorMessage = 'Unable to load predictions. Please disable ad blockers or allow firestore.googleapis.com.';
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      console.log("Auth still loading, waiting...");
      return;
    }
    fetchPredictions();
  }, [authLoading, currentUser, navigate]);

  const handleViewResult = (prediction) => {
    const mappedResult = {
      smiles: prediction.smiles,
      cas: prediction.cas,
      predictedValue: prediction.prediction,
      efficiency: prediction.efficiency,
      molecule_image: prediction.molecule_image,
      info: {
        prediction: prediction.prediction,
        efficiency: prediction.efficiency,
        formula: prediction.formula,
        iupac_name: prediction.iupac_name,
      },
      properties: prediction.properties,
      descriptors: prediction.descriptors,
      shap_plot: prediction.shap_plot,
      date: prediction.date,
      model_name: prediction.model_name,
      origin: "Dashboard",
    };
    navigate("/results", { state: mappedResult });
  };

  return (
    <div className={`flex h-screen ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-white"}`}>
      <Sidebar />
      <main className="main-content flex-1 p-6 ml-64">
        <nav aria-label="breadcrumb" className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center">
              <span className={`${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Dashboard</span>
            </li>
          </ol>
        </nav>
        <header className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Dashboard</h1>
        </header>

        <div className={`rounded-lg shadow p-4 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Last 8 predictions</h2>
          {loading ? (
            <div className="text-center py-4">
              <div className="relative inline-block" style={{ minWidth: "150px", minHeight: "50px" }}>
                <span
                  className="text-4xl animate-mouse-scurry"
                  style={{
                    display: "inline-block",
                    animation: "mouse-scurry 2s ease-in-out infinite !important",
                    transformOrigin: "center",
                  }}
                >
                  🐁
                </span>
                <span
                  className="text-xl text-yellow-400 absolute top-0 right-[-2rem] opacity-0 animate-cheese-pop"
                  style={{
                    animation: "cheese-pop 2s ease-in-out infinite !important",
                    animationDelay: "0.5s",
                  }}
                >
                  🧀
                </span>
              </div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Trying to fetch predictions...</p>
            </div>
          ) : error ? (
            <p className="text-red-500 dark:text-red-400 text-center py-4">{error}</p>
          ) : predictions.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              No predictions available. Create one <Link to="/new-prediction" className="text-blue-500 dark:text-blue-400 hover:underline">here</Link>.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className={`min-w-full ${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}>
                <thead>
                  <tr className={`${isDarkMode ? "bg-gray-400" : "bg-gray-100"}`}>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">SMILES</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">CAS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Prediction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Efficiency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Enzyme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 dark:divide-gray-600">
                  {predictions.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.smiles}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.cas || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.model_name === "ALR1"
                          ? `${(item.prediction * 100).toFixed(3)}%`
                          : item.prediction}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        style={{
                          color:
                            item.efficiency === "Effective"
                              ? "green"
                              : item.efficiency === "Not Effective"
                              ? "red"
                              : isDarkMode ? "#e5e7eb" : "#111827",
                        }}
                      >
                        {item.efficiency || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.model_name || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewResult(item)}
                          className="bg-blue-500 dark:bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <ToastContainer closeButton={false} theme={isDarkMode ? "dark" : "light"} />
    </div>
  );
};

export default DashboardPage;