import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const HistoryPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [filteredPredictions, setFilteredPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const rowsPerPage = 9;
  const navigate = useNavigate();
  const API_URL =  import.meta.env.VITE_API_URL  || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setError("Please log in to view your prediction history");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/prediction-history/`, {
          headers: {
            "User-Id": userId,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch predictions");
        }

        const data = await response.json();
        console.log("Fetched predictions:", data);
        setPredictions(data);
        setFilteredPredictions(data);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!filterText) {
      setFilteredPredictions(predictions);
      return;
    }

    const lowerCaseFilter = filterText.toLowerCase();
    const filtered = predictions.filter((item) => {
      if (filterColumn === "all") {
        return (
          new Date(item.date).toLocaleString("de-DE").toLowerCase().includes(lowerCaseFilter) ||
          (item.smiles && item.smiles.toLowerCase().includes(lowerCaseFilter)) ||
          (item.cas && item.cas.toLowerCase().includes(lowerCaseFilter)) ||
          (item.prediction &&
            (typeof item.prediction === "number"
              ? item.prediction.toFixed(4)
              : item.prediction.toString()
            ).toLowerCase().includes(lowerCaseFilter)) ||
          (item.efficiency && item.efficiency.toLowerCase().includes(lowerCaseFilter))
        );
      } else {
        const value = item[filterColumn];
        if (!value) return false;
        if (filterColumn === "date") {
          return new Date(value).toLocaleString("de-DE").toLowerCase().includes(lowerCaseFilter);
        }
        if (filterColumn === "prediction") {
          return (typeof value === "number" ? value.toFixed(4) : value.toString())
            .toLowerCase()
            .includes(lowerCaseFilter);
        }
        return value.toString().toLowerCase().includes(lowerCaseFilter);
      }
    });

    setFilteredPredictions(filtered);
    setCurrentPage(1);
  }, [filterText, filterColumn, predictions]);

  const handleFilterChange = (e) => {
    setFilterText(e.target.value);
  };

  const handleColumnChange = (e) => {
    setFilterColumn(e.target.value);
  };

  const handleClearFilter = () => {
    setFilterText("");
    setFilterColumn("all");
    setFilteredPredictions(predictions);
    setCurrentPage(1);
  };

  const handleDeleteResult = async (predictionToDelete) => {
    if (!predictionToDelete.id) {
      console.error("Prediction has no ID:", predictionToDelete);
      toast.error("Cannot delete prediction: No ID found");
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("Please log in to delete predictions");
      setError("Please log in to delete predictions");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/prediction/${predictionToDelete.id}/delete/`, {
        method: "DELETE",
        headers: {
          "User-Id": userId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Delete error:", response.status, errorData);
        throw new Error(errorData.error || "Failed to delete prediction");
      }

      const updatedPredictions = predictions.filter(
        (prediction) => prediction.id !== predictionToDelete.id
      );
      setPredictions(updatedPredictions);
      setFilteredPredictions(updatedPredictions);
      toast.success("Prediction deleted successfully");
      setError(null);
    } catch (error) {
      console.error("Failed to delete prediction:", error);
      toast.error(error.message || "Failed to delete prediction. Please try again.");
      setError(error.message || "Failed to delete prediction. Please try again.");
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
      origin: "history",
    };
    navigate("/results", { state: mappedResult });
  };

  if (loading)
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 ml-64">
          <div>Loading predictions...</div>
        </main>
        <ToastContainer />
      </div>
    );

  if (error)
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 ml-64">
          <div>Error: {error}</div>
        </main>
        <ToastContainer />
      </div>
    );

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredPredictions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPredictions.length / rowsPerPage);

  const predictionValues = predictions
    .map((item) => (typeof item.prediction === "number" ? item.prediction : 0))
    .filter((val) => val !== 0);

  const dates = predictions.map((item) => new Date(item.date).toLocaleDateString("de-DE"));
  const predictionsByDate = predictions.map((item) =>
    typeof item.prediction === "number" ? item.prediction : 0
  );

  const histogramData = predictionValues.length === 0
    ? {
        labels: ["No data"],
        datasets: [
          {
            label: "Predicted value distribution",
            data: [0],
            backgroundColor: "rgba(54, 162, 235, 0.6)",
          },
        ],
      }
    : predictionValues.length === 1
    ? {
        labels: [
          `${(predictionValues[0] - 0.5).toFixed(2)} - ${(predictionValues[0] + 0.5).toFixed(2)}`,
        ],
        datasets: [
          {
            label: "Predicted value distribution",
            data: [1], 
            backgroundColor: "rgba(54, 162, 235, 0.6)",
          },
        ],
      }
    : {
        labels: Array.from({ length: 10 }, (_, i) => {
          const min = Math.min(...predictionValues);
          const max = Math.max(...predictionValues);
          const step = (max - min) / 10;
          return `${(min + i * step).toFixed(2)} - ${(min + (i + 1) * step).toFixed(2)}`;
        }),
        datasets: [
          {
            label: "Predicted value distribution",
            data: Array.from({ length: 10 }, (_, i) => {
              const min = Math.min(...predictionValues);
              const max = Math.max(...predictionValues);
              const step = (max - min) / 10;
              return predictionValues.filter(
                (val) => val >= min + i * step && val < min + (i + 1) * step
              ).length;
            }),
            backgroundColor: "rgba(54, 162, 235, 0.6)",
          },
        ],
      };

  const lineData = predictions.length === 0
    ? {
        labels: ["No Data"],
        datasets: [
          {
            label: "Prediction Trend",
            data: [0],
            fill: false,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
          },
        ],
      }
    : predictions.length === 1
    ? {
        labels: [dates[0], dates[0]], 
        datasets: [
          {
            label: "Prediction Trend",
            data: [predictionsByDate[0], predictionsByDate[0]], 
            fill: false,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
          },
        ],
      }
    : {
        labels: dates,
        datasets: [
          {
            label: "Prediction trend",
            data: predictionsByDate,
            fill: false,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
          },
        ],
      };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text:
          predictions.length === 1
            ? "Single prediction (Limited trend)"
            : predictions.length === 0
            ? "No predictions available"
            : "",
      },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 ml-64">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-black">
            Prediction history
            <span className="text-sm text-gray-500 ml-2">
              ({filteredPredictions.length} predictions)
            </span>
          </h2>

          <div className="mb-6 flex items-center space-x-4">
            <div className="flex-1">
              <label htmlFor="filter" className="text-sm font-medium text-gray-700 mr-2">
                Filter:
              </label>
              <input
                id="filter"
                type="text"
                value={filterText}
                onChange={handleFilterChange}
                placeholder="Search predictions..."
                className="w-full px-3 py-2 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="column" className="text-sm font-medium text-gray-700 mr-2">
                Column:
              </label>
              <select
                id="column"
                value={filterColumn}
                onChange={handleColumnChange}
                className="px-3 py-2 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All columns</option>
                <option value="date">Date</option>
                <option value="smiles">SMILES</option>
                <option value="cas">CAS</option>
                <option value="prediction">Prediction</option>
                <option value="efficiency">Efficiency</option>
              </select>
            </div>
            <button
              onClick={handleClearFilter}
              className="bg-gray-300 text-white px-4 py-2 rounded hover:bg-gray-400"
            >
              Clear filter
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg shadow">
              <Bar data={histogramData} options={options} />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow">
              <Line data={lineData} options={options} />
            </div>
          </div>

          {!filteredPredictions || filteredPredictions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No predictions found.</p>
              <p className="text-sm text-gray-400 mt-2">
                {filterText ? "Try adjusting your filter." : "Make some predictions first!"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SMILES
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CAS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prediction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Efficiency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-black">
                    {currentItems.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(item.date).toLocaleString("de-DE")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.smiles}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.cas || "-"}</td>
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
                          <button
                            onClick={() => handleViewResult(item)}
                            className="bg-blue-500 text-current text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteResult(item)}
                            className="bg-red-500 text-current text-white px-3 py-1 rounded hover:bg-red-600 ml-2"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex justify-center space-x-2">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`px-3 py-1 rounded ${
                        currentPage === index + 1
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <ToastContainer />
    </div>
  );
};

export default HistoryPage;