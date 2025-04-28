import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "./contexts/AuthContext";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase/firebase";
import { Menu } from "lucide-react";

const NewPredictionPage = ({ onResults }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [inputType, setInputType] = useState("SMILES");
  const [smiles, setSmiles] = useState("");
  const [cas, setCas] = useState("");
  const [pipelineEntries, setPipelineEntries] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

  useEffect(() => {
    const handleThemeChange = (e) => {
      setIsDarkMode(e.detail.isDark);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  const handleInputTypeChange = (e) => {
    const newInputType = e.target.value;
    setInputType(newInputType);
    if (newInputType === "SMILES") {
      setCas("");
    } else if (newInputType === "CAS") {
      setSmiles("");
    }
  };

  const handleAdd = () => {
    if (inputType === "SMILES" && !smiles) {
      toast.error("SMILES code cannot be empty");
      return;
    }
    if (inputType === "CAS" && !cas) {
      toast.error("CAS code cannot be empty");
      return;
    }

    const entry = {
      smiles: inputType === "SMILES" ? smiles : "",
      cas: inputType === "CAS" ? cas : "",
      type: inputType,
    };
    setPipelineEntries([entry, ...pipelineEntries]);
    setSmiles("");
    setCas("");
    setErrorMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  const handleDelete = (index) => {
    const updatedEntries = pipelineEntries.filter((_, i) => i !== index);
    setPipelineEntries(updatedEntries);
  };

  const handleRun = async () => {
    if (pipelineEntries.length === 0) {
      toast.error("No entries to process");
      return;
    }
    if (!currentUser) {
      toast.error("Please log in to make predictions");
      navigate("/sign-in");
      return;
    }

    setErrorMessage("");
    setIsRunning(true);

    try {
      let allResults = [];
      for (const entry of pipelineEntries) {
        const response = await fetch(`${API_URL}/upload/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Id": currentUser.uid,
          },
          body: JSON.stringify({
            smiles: entry.smiles.trim() || "",
            cas: entry.cas.trim() || "",
            inputType: entry.type,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error("API error response:", text);
          let errorMessage = "An error occurred";
          try {
            const errorObj = JSON.parse(text);
            errorMessage = errorObj.error || text;
          } catch {
            errorMessage = text;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        allResults.push(data);
      }

      const formattedResults = allResults.flatMap((result) => [
        {
          date: new Date(),
          smiles: result.ALR2?.smiles || "",
          cas: result.ALR2?.cas || "",
          prediction: result.ALR2?.info?.prediction || 0,
          efficiency: result.ALR2?.info?.efficiency || "N/A",
          numHeavyAtoms: result.ALR2?.properties?.num_heavy_atoms || 0,
          molecule_image: result.ALR2?.molecule_image || "",
          descriptors: result.ALR2?.descriptors || {},
          properties: result.ALR2?.properties || {},
          shap_plot: result.ALR2?.shap_plot || "",
          info: result.ALR2?.info || {},
          model_name: "ALR2",
          formula: result.ALR2?.info?.formula || "",
          iupac_name: result.ALR2?.info?.iupac_name || "",
        },
        {
          date: new Date(),
          smiles: result.ALR1?.smiles || "",
          cas: result.ALR1?.cas || "",
          prediction: result.ALR1?.info?.prediction || 0,
          efficiency: result.ALR1?.info?.efficiency || "N/A",
          numHeavyAtoms: result.ALR1?.properties?.num_heavy_atoms || 0,
          molecule_image: result.ALR1?.molecule_image || "",
          descriptors: result.ALR1?.descriptors || {},
          properties: result.ALR1?.properties || {},
          shap_plot: result.ALR1?.shap_plot || "",
          info: result.ALR1?.info || {},
          model_name: "ALR1",
          formula: result.ALR1?.info?.formula || "",
          iupac_name: result.ALR1?.info?.iupac_name || "",
        },
      ]);

      const predictionsRef = collection(db, `users/${currentUser.uid}/predictions`);
      for (const result of formattedResults) {
        await addDoc(predictionsRef, result);
      }

      toast.success("Predictions saved successfully!");

      if (onResults) {
        onResults(formattedResults);
      }

      navigate("/results", { state: { results: formattedResults, origin: "new-prediction" } });
    } catch (error) {
      let errorMessage = error.message || "An error occurred while processing your request.";
      if (error.message.includes("net::ERR_CONNECTION_REFUSED")) {
        errorMessage = "Cannot connect to the backend server. Ensure the Django server is running on port 8000.";
      } else if (error.message.includes("500")) {
        errorMessage = "Backend server error. Check Django server logs for details.";
      }
      toast.error(errorMessage);
      setErrorMessage(errorMessage);
    } finally {
      setIsRunning(false);
    }
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
          className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center">
              <span className={`${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                New prediction
              </span>
            </li>
          </ol>
        </nav>
        <header className="flex justify-between items-center mb-6">
          <h1
            className={`text-xl sm:text-2xl font-bold ${
              isDarkMode ? "text-gray-200" : "text-gray-800"
            }`}
          >
            New prediction
          </h1>
        </header>

        <div
          className={`rounded-lg shadow p-4 sm:p-6 mb-6 ${
            isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium mb-2">Input type</label>
              <select
                className={`h-11 w-full p-2 border rounded cursor-pointer ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-300"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                value={inputType}
                onChange={handleInputTypeChange}
              >
                <option>SMILES</option>
                <option>CAS</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">{inputType} code:</label>
              <input
                type="text"
                value={inputType === "SMILES" ? smiles : cas}
                onChange={(e) =>
                  inputType === "SMILES" ? setSmiles(e.target.value) : setCas(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder={`Enter ${inputType} code`}
                className={`h-11 w-full p-2 border rounded placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-300 placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>
            <div className="w-full sm:w-32 self-start">
              <label
                htmlFor="add-text"
                className="text-sm font-medium mb-2 block text-transparent"
              >
                Add
              </label>
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-5 py-3 rounded text-sm hover:bg-blue-700 mt-6 sm:mt-0 sm:self-end"
            >
              Add
            </button>
            </div>
          </div>
        </div>

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
            Run pipeline
          </h2>
          {isRunning ? (
            <div className="text-center py-4">
              <div className="modern-mouse-container">
                <div className="modern-mouse">
                  <div className="mouse-body"></div>
                  <div className="mouse-trail"></div>
                </div>
              </div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Processing predictions...</p>
            </div>
          ) : pipelineEntries.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No entries added yet.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto overflow-x-auto">
              <table
                className={`w-full text-left border-collapse ${
                  isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white"
                }`}
              >
                <thead
                  className={`sticky top-0 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
                >
                  <tr>
                    <th className="p-2 text-xs sm:text-sm font-medium">SMILES code</th>
                    <th className="p-2 text-xs sm:text-sm font-medium hidden sm:table-cell">
                      CAS code
                    </th>
                    <th className="p-2 text-xs sm:text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 dark:divide-gray-600">
                  {pipelineEntries.map((entry, index) => (
                    <tr key={index}>
                      <td className="p-2 text-sm">{entry.smiles || "-"}</td>
                      <td className="p-2 text-sm hidden sm:table-cell">{entry.cas || "-"}</td>
                      <td className="p-2">
                        <button
                          onClick={() => handleDelete(index)}
                          className="bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-red-700 cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`mt-4 w-full sm:w-auto text-white px-4 py-2 rounded text-base sm:text-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[100px] ${
              isRunning
                ? "bg-gray-400 cursor-not-allowed opacity-50"
                : "bg-green-600 hover:bg-green-700"
            }`}
            title={isRunning ? "Processing, please wait..." : "Run the prediction pipeline"}
          >
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </main>
      <ToastContainer closeButton={false} theme={isDarkMode ? "dark" : "light"} />
    </div>
  );
};

export default NewPredictionPage;