import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "./contexts/AuthContext";
import { collection, query, getDocs, doc, deleteDoc, orderBy } from "firebase/firestore";
import { db } from "./firebase/firebase";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
  const { currentUser, authLoading } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) {
        console.log("Auth still loading, waiting...");
        return;
      }

      if (!currentUser) {
        console.log("No user, redirecting to sign-in");
        setError("Please log in to view your prediction history");
        setLoading(false);
        navigate("/sign-in", { replace: true });
        return;
      }

      try {
        console.log("Fetching predictions for user:", currentUser.uid);
        const predictionsRef = collection(db, `users/${currentUser.uid}/predictions`);
        const q = query(predictionsRef, orderBy("date", "desc")); // Sort by date descending
        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.() || new Date(doc.data().date), // Handle Timestamp or ISO string
        }));
        setPredictions(data);
        setFilteredPredictions(data);
        setError(null);
      } catch (err) {
        let errorMessage = "Failed to load predictions.";
        if (err.message.includes("net::ERR_BLOCKED_BY_CLIENT")) {
          errorMessage = "Unable to load predictions. Please disable ad blockers or allow firestore.googleapis.com.";
        }
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, currentUser, navigate]);

  useEffect(() => {
    if (!filterText) {
      setFilteredPredictions(predictions);
      return;
    }

    const lowerCaseFilter = filterText.toLowerCase();
    const filtered = predictions.filter((item) => {
      if (filterColumn === "all") {
        const dateStr = formatDate(item.date).toLowerCase();

        return (
          dateStr.includes(lowerCaseFilter) ||
          (item.smiles && item.smiles.toLowerCase().includes(lowerCaseFilter)) ||
          (item.cas && item.cas.toLowerCase().includes(lowerCaseFilter)) ||
          (item.prediction &&
            (typeof item.prediction === "number"
              ? item.prediction.toFixed(4)
              : item.prediction.toString()
            ).toLowerCase().includes(lowerCaseFilter)) ||
          (item.efficiency && item.efficiency.toLowerCase().includes(lowerCaseFilter))
          (item.model_name && item.model_name.toLowerCase().includes(lowerCaseFilter))
        );
      } else {
        const value = item[filterColumn];
        if (!value) return false;
  
        if (filterColumn === "date") {
          const dateStr = formatDate(item.date).toLowerCase();
          console.log(`Comparing dateStr: "${dateStr}" with filter: "${lowerCaseFilter}"`); 
          return dateStr.startsWith(lowerCaseFilter);
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

  const handleDeleteResult = async (prediction) => {
    try {
      if (!currentUser) {
        throw new Error("User not authenticated. Please log in.");
      }

      console.log("Deleting prediction:", prediction.id, "for user:", currentUser.uid);
      const predictionRef = doc(db, `users/${currentUser.uid}/predictions`, prediction.id);
      await deleteDoc(predictionRef);

      setPredictions(predictions.filter((pred) => pred.id !== prediction.id));
      setFilteredPredictions(filteredPredictions.filter((pred) => pred.id !== prediction.id));
      toast.success("Prediction deleted successfully.");
    } catch (err) {
      console.error("Error deleting prediction:", err);
      let errorMessage = "Failed to delete prediction.";
      if (err.message.includes("net::ERR_BLOCKED_BY_CLIENT")) {
        errorMessage = "Unable to delete prediction. Please disable ad blockers or allow firestore.googleapis.com.";
      }
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

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
      origin: "history",
    };
    navigate("/results", { state: mappedResult });
  };

  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };
  
  const getHistogramData = () => {
    const alr1Values = filteredPredictions
      .filter((item) => item.model_name === "ALR1")
      .map((item) => {
        const value = typeof item.prediction === "number" ? item.prediction : parseFloat(item.prediction);
        return isNaN(value) ? NaN : value;
      })
      .filter((val) => !isNaN(val));

    const alr2Values = filteredPredictions
      .filter((item) => item.model_name === "ALR2")
      .map((item) => {
        const value = typeof item.prediction === "number" ? item.prediction : parseFloat(item.prediction);
        return isNaN(value) ? NaN : value;
      })
      .filter((val) => !isNaN(val));

    const allValues = [...alr1Values, ...alr2Values];

    if (allValues.length === 0) {
      return {
        labels: ["No data"],
        datasets: [
          {
            label: "ALR1",
            data: [0],
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
          {
            label: "ALR2",
            data: [0],
            backgroundColor: "rgba(255, 99, 132, 0.6)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      };
    }

    const min = Math.min(...allValues);
    const max = Math.max(...allValues) + 1;
    const step = (max - min) / 10 || 1;
    const labels = Array.from({ length: 10 }, (_, i) =>
      `${(min + i * step).toFixed(2)} - ${(min + (i + 1) * step).toFixed(2)}`
    );

    const alr1Data = Array.from({ length: 10 }, (_, i) =>
      alr1Values.filter(
        (val) => val >= min + i * step && val < min + (i + 1) * step
      ).length
    );

    const alr2Data = Array.from({ length: 10 }, (_, i) =>
      alr2Values.filter(
        (val) => val >= min + i * step && val < min + (i + 1) * step
      ).length
    );

    return {
      labels,
      datasets: [
        {
          label: "ALR1",
          data: alr1Data,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
        {
          label: "ALR2",
          data: alr2Data,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  const getTrendData = () => {
    const dateCounts = filteredPredictions.reduce((acc, item) => {
      const date = new Date(item.date).toLocaleDateString("de-DE");
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const dates = Object.keys(dateCounts)
      .sort(
        (a, b) => new Date(a.split(".").reverse().join("-")) - new Date(b.split(".").reverse().join("-"))
      )
      .reverse();
    const counts = dates.map((date) => dateCounts[date]);

    if (dates.length === 0) {
      return {
        labels: ["No data"],
        datasets: [
          {
            label: "Predictions",
            data: [0],
            backgroundColor: "rgb(75, 192, 192)",
            borderColor: "rgb(75, 192, 192)",
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: dates,
      datasets: [
        {
          label: "Predictions",
          data: counts,
          backgroundColor: "rgb(75, 192, 192)",
          borderColor: "rgb(75, 192, 192)",
          borderWidth: 1,
        },
      ],
    };
  };

  const histogramOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Predicted value distribution",
      },
    },
    scales: {
      y: {
        min: 0,
        ticks: { stepSize: 1 },
        title: { display: true, text: "Count" },
      },
      x: {
        title: { display: true, text: "Predicted value range" },
      },
    },
  };

  const trendOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: predictions.length === 0 ? "No predictions available" : "Predictions per day",
      },
    },
    scales: {
      y: {
        min: 0,
        ticks: { stepSize: 1 },
        title: { display: true, text: "Number of predictions" },
      },
      x: {
        title: { display: true, text: "Date" },
      },
    },
  };

  if (loading)
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 ml-64">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-black mb-6">Prediction history</h1>
            <div className="text-center py-4">
              <div className="relative inline-block" style={{ minWidth: "100px", minHeight: "50px" }}>
                <span
                  className="text-4xl animate-mouse-scurry"
                  style={{ display: "inline-block", animation: "mouse-scurry 2s ease-in-out infinite !important" }}
                >
                  🐁
                </span>
                <span
                  className="text-xl text-yellow-400 absolute top-0 -right-8 opacity-0 animate-cheese-pop"
                  style={{
                    animation: "cheese-pop 2s ease-in-out infinite !important",
                    animationDelay: "0.5s",
                  }}
                >
                  🧀
                </span>
              </div>
              <p className="mt-2 text-gray-500">Trying to fetch prediction history...</p>
            </div>
          </div>
        </main>
        <ToastContainer closeButton={false} />
      </div>
    );

  if (error)
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 ml-64">
          <div>Error: {error}</div>
        </main>
        <ToastContainer closeButton={false} />
      </div>
    );

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredPredictions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPredictions.length / rowsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 ml-64">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-black">
            Prediction history
            <span className="text-sm text-gray-500 ml-2">
              ({filteredPredictions.length} predictions)
            </span>
          </h1>

          <div className="mb-6 flex items-start space-x-4">
            <div className="flex-1">
              <label htmlFor="filter" className="text-sm font-medium text-gray-700 mb-1 block">
                Filter:
              </label>
              <input
                id="filter"
                type="text"
                value={filterText}
                onChange={handleFilterChange}
                placeholder="Search predictions..."
                className="w-full px-3 h-11 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="column" className="text-sm font-medium text-gray-700 mb-1 block">
                Column:
              </label>
              <select
                id="column"
                value={filterColumn}
                onChange={handleColumnChange}
                className="h-11 px-3 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All columns</option>
                <option value="date">Date</option>
                <option value="smiles">SMILES</option>
                <option value="cas">CAS</option>
                <option value="prediction">Prediction</option>
                <option value="efficiency">Efficiency</option>
                <option value="model_name">Type</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="invisible block pointer-events-none select-none" aria-hidden="true">
                Clear
              </label>
              <button
                onClick={handleClearFilter}
                className="h-11 bg-blue-500 text-white px-4 rounded hover:bg-blue-600 cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg shadow">
              <Bar data={getHistogramData()} options={histogramOptions} />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow">
              <Bar data={getTrendData()} options={trendOptions} />
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
                        Model type
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
                          {new Date(item.date).toLocaleDateString("de-DE", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
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
                        <td className="px-6 py-4 whitespace-nowrap">{item.model_name || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewResult(item)}
                            className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteResult(item)}
                            className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 ml-2 cursor-pointer"
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
                  {(() => {
                    const pages = [];
                    const visiblePages = 4;
                    const half = Math.floor(visiblePages / 2);

                    let start = Math.max(1, currentPage - half);
                    let end = Math.min(totalPages, start + visiblePages - 1);

                    if (end - start < visiblePages - 1) {
                      start = Math.max(1, end - visiblePages + 1);
                    }

                    if (start > 1) {
                      pages.push(1);
                      if (start > 2) pages.push("ellipsis-start");
                    }

                    for (let i = start; i <= end; i++) {
                      pages.push(i);
                    }

                    if (end < totalPages) {
                      if (end < totalPages - 1) pages.push("ellipsis-end");
                      pages.push(totalPages);
                    }

                    return pages.map((item, index) =>
                      typeof item === "string" ? (
                        <span key={item + index} className="px-3 py-1">
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item)}
                          className={`px-3 py-1 rounded ${
                            currentPage === item
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <ToastContainer closeButton={false} />
    </div>
  );
};

export default HistoryPage;