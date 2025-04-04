import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NewPredictionPage = ({ onResults }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [inputType, setInputType] = useState("SMILES");
  const [smiles, setSmiles] = useState("");
  const [cas, setCas] = useState("");
  const [pipelineEntries, setPipelineEntries] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL  || 'http://127.0.0.1:8000/api';

  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleAdd = () => {
    if (!smiles && !cas) {
      toast.error("SMILES or CAS code cannot be empty");
      return;
    }
    const entry = { smiles, cas, type: inputType };
    setPipelineEntries([entry, ...pipelineEntries]);
    setSmiles("");
    setCas("");
    setErrorMessage("");
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
    setErrorMessage("");
    setIsRunning(true);

    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("Please log in to make predictions");
      setIsRunning(false);
      return;
    }

    try {
      let allResults = [];
      for (const entry of pipelineEntries) {
        const response = await fetch(`${API_URL}/upload/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Id": userId,
          },
          body: JSON.stringify({
            smiles: entry.smiles || "",
            cas: entry.cas || "",
            inputType: entry.type,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          allResults.push(data);
        } else {
          throw new Error(
            data.error ||
              `An error occurred while processing an entry: ${entry.smiles || entry.cas}`
          );
        }
      }

      toast.success("Pipeline run successfully");

      const formattedResults = allResults.flatMap((result) => [
        {
          date: new Date().toLocaleString(),
          smiles: result.ALR2.smiles,
          cas: result.ALR2.cas,
          predictedValue: result.ALR2.info.prediction,
          efficiency: result.ALR2.info.efficiency,
          numHeavyAtoms: result.ALR2.properties.num_heavy_atoms,
          moleculeImage: result.ALR2.molecule_image,
          descriptors: result.ALR2.descriptors,
          properties: result.ALR2.properties,
          shap_plot: result.ALR2.shap_plot,
          info: result.ALR2.info,
          model: "ALR2",
        },
        {
          date: new Date().toLocaleString(),
          smiles: result.ALR1.smiles,
          cas: result.ALR1.cas,
          predictedValue: result.ALR1.info.prediction,
          efficiency: result.ALR1.info.efficiency,
          numHeavyAtoms: result.ALR1.properties.num_heavy_atoms,
          moleculeImage: result.ALR1.molecule_image,
          descriptors: result.ALR1.descriptors,
          properties: result.ALR1.properties,
          shap_plot: result.ALR1.shap_plot,
          info: result.ALR1.info,
          model: "ALR1",
        },
      ]);

      if (onResults) {
        onResults(formattedResults);
      }

      navigate("/results", { state: { results: formattedResults } });
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "An error occurred while processing your request.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-6 ml-64">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">New prediction</h1>
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

        <div className="bg-gray-100 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-row items-center space-x-4">
            <div className="mb-4 w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Input type</label>
              <select
                className="w-full p-2 border border-gray-300 rounded text-black"
                value={inputType}
                onChange={(e) => setInputType(e.target.value)}
              >
                <option>SMILES</option>
                <option>CAS</option>
              </select>
            </div>
            <div className="mb-4 flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {inputType} code:
              </label>
              <input
                type="text"
                value={inputType === "SMILES" ? smiles : cas}
                onChange={(e) =>
                  inputType === "SMILES" ? setSmiles(e.target.value) : setCas(e.target.value)
                }
                placeholder={`Enter ${inputType} code`}
                className="w-full p-2 border border-gray-300 rounded text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded text-lg hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
          {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Run pipeline</h2>
          {pipelineEntries.length === 0 ? (
            <p className="text-gray-500">No entries added yet.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-gray-600">Smiles code</th>
                  <th className="p-2 text-gray-600">CAS code</th>
                  <th className="p-2 text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pipelineEntries.map((entry, index) => (
                  <tr key={index}>
                    <td className="p-2 text-gray-800">{entry.smiles}</td>
                    <td className="p-2 text-gray-800">{entry.cas || "-"}</td>
                    <td className="p-2">
                      <button
                        onClick={() => handleDelete(index)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`mt-4 relative ${
              isRunning
                ? "bg-green-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } text-white px-4 py-2 rounded text-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[100px]`}
          >
            {isRunning ? (
              <>
                <span className="opacity-0">Run</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                </div>
              </>
            ) : (
              "Run"
            )}
          </button>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
};

export default NewPredictionPage;