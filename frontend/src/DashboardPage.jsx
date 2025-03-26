import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    fetchLastPredictions();
  }, []);

  const fetchLastPredictions = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setLoading(false);
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/api/prediction-history/", {
        headers: {
          "User-Id": userId,
        },
      });

      const data = await response.json();
      setPredictions(data.slice(0, 8)); 
      setLoading(false);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      toast.error("Failed to load predictions");
      setLoading(false);
    }
  };

  const handleViewResult = (prediction) => {
    const mappedResult = {
      smiles: prediction.smiles,
      cas: prediction.cas,
      predictedValue: prediction.prediction,
      efficiency: prediction.efficiency,
      moleculeImage: prediction.molecule_image,
      info: {
        prediction: prediction.prediction,
        efficiency: prediction.efficiency,
        formula: prediction.formula,
        iupac_name: prediction.iupac_name,
      },
      properties: prediction.properties,
      descriptors: prediction.descriptors,
      shap_plot: prediction.shap_plot,
      xsmiles_data: prediction.xsmiles_data,
      date: prediction.date,
      origin: "dashboard",
    };
    navigate("/results", { state: mappedResult });
  };

  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-6 ml-64">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Dashboard</h1>
          <div className="relative">
            <div
              onClick={toggleProfileMenu}
              className="flex items-center space-x-2 text-gray-800 hover:text-gray-600 cursor-pointer"
            >
              <img src="/person-icon.png" alt="User Profile" className="h-6 w-6" />
            </div>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg">
                <Link
                  to="/profile"
                  state={{ from: location.pathname }} 
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Settings
                </Link>
              </div>
            )}
          </div>
        </header>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Last 8 predictions</h2>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : predictions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No predictions available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SMILES</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prediction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {predictions.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(item.date).toLocaleString("de-DE")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.smiles}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.cas || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {typeof item.prediction === "number"
                          ? item.prediction.toFixed(4)
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
                              : "black",
                        }}
                      >
                        {item.efficiency || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.model_name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewResult(item)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
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
      <ToastContainer />
    </div>
  );
};

export default DashboardPage;