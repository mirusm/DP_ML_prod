import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "./contexts/AuthContext";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "./firebase/firebase";
import { Menu } from "lucide-react";

const DashboardPage = () => {
  const CLASSIFICATION_MODELS = ["ALR1", "AKR1C1", "AKR1C2", "AKR1C3"];
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isClassificationModel = (modelName) =>
    CLASSIFICATION_MODELS.includes((modelName || "").toUpperCase());

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
      const predictionsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPredictions(predictionsData);
      setError(null);
    } catch (error) {
      let errorMessage = "Failed to load predictions.";
      if (error.message.includes("net::ERR_BLOCKED_BY_CLIENT")) {
        errorMessage = "Unable to load predictions. Please disable ad blockers or allow firestore.googleapis.com.";
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
    <div className={`flex min-h-screen ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-white"}`}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main
        className={`flex-1 p-4 sm:p-6 transition-all duration-300 overflow-auto ${
          isSidebarOpen ? "ml-64" : "ml-0"
        } md:ml-64 ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-white"}`}
      >
        <button
          className="md:hidden mb-4 p-2 rounded-lg bg-blue-600 text-white"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <nav
          aria-label="breadcrumb"
          className="mb-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center">
              <span className={`${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                Dashboard
              </span>
            </li>
          </ol>
        </nav>
        <header className="flex justify-between items-center mb-4 sm:mb-6">
          <h1
            className={`text-xl sm:text-2xl font-bold ${
              isDarkMode ? "text-gray-200" : "text-gray-800"
            }`}
          >
            Dashboard
          </h1>
        </header>

        <div
          className={`rounded-lg shadow p-4 sm:p-6 ${
            isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white"
          }`}
        >
          <h2
            className={`text-lg sm:text-xl font-bold mb-4 ${
              isDarkMode ? "text-gray-200" : "text-gray-800"
            }`}
          >
            Last 8 predictions
          </h2>
          {loading ? (
            <div className="text-center py-4">
              <div
                className="relative inline-block"
                style={{ minWidth: "150px", minHeight: "50px" }}
              >
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
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Trying to fetch predictions...
              </p>
            </div>
          ) : error ? (
            <p className="text-red-500 dark:text-red-400 text-center py-4 text-sm sm:text-base">
              {error}
            </p>
          ) : predictions.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4 text-sm sm:text-base">
              No predictions available. Create one{" "}
              <Link
                to="/new-prediction"
                className="text-blue-500 dark:text-blue-400 hover:underline"
              >
                here
              </Link>
              .
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table
                className={`w-full text-left border-collapse ${
                  isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white"
                }`}
              >
                <thead
                  className={`sticky top-0 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
                >
                  <tr>
                    <th className="p-2 sm:p-3 text-xs sm:text-sm font-medium min-w-[120px]">
                      Date
                    </th>
                    <th className="p-2 sm:p-3 text-xs sm:text-sm font-medium min-w-[100px]">
                      SMILES
                    </th>
                    <th className="p-2 sm:p-3 text-xs sm:text-sm font-medium hidden sm:table-cell min-w-[80px]">
                      CAS
                    </th>
                    <th className="p-2 sm:p-3 text-xs sm:text-sm font-medium min-w-[80px]">
                      Prediction
                    </th>
                    <th className="p-2 sm:p-3 text-xs sm:text-sm font-medium hidden md:table-cell min-w-[80px]">
                      Efficiency
                    </th>
                    <th className="p-2 sm:p-3 text-xs sm:text-sm font-medium hidden lg:table-cell min-w-[80px]">
                      Enzyme
                    </th>
                    <th className="p-2 sm:p-3 text-xs sm:text-sm font-medium min-w-[80px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 dark:divide-gray-600">
                  {predictions.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm break-all">
                        {item.smiles || "-"}
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm hidden sm:table-cell whitespace-nowrap">
                        {item.cas || "-"}
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm whitespace-nowrap">
                        {isClassificationModel(item.model_name)
                          ? `${(item.prediction * 100).toFixed(2)}%`
                          : Number(item.prediction).toFixed(2)}
                      </td>
                      <td
                        className="p-2 sm:p-3 text-xs sm:text-sm hidden md:table-cell whitespace-nowrap"
                        style={{
                          color:
                            item.efficiency === "Effective"
                              ? "green"
                              : item.efficiency === "Not Effective"
                              ? "red"
                              : isDarkMode
                              ? "#e5e7eb"
                              : "#111827",
                        }}
                      >
                        {item.efficiency || "-"}
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm hidden lg:table-cell whitespace-nowrap">
                        {item.model_name || "-"}
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm whitespace-nowrap">
                        <button
                          onClick={() => handleViewResult(item)}
                          className="bg-blue-500 dark:bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label={`View details for prediction ${index + 1}`}
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