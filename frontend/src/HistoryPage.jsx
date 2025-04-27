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
              ? item.prediction.toFixed(3)
              : item.prediction.toString()
            ).toLowerCase().includes(lowerCaseFilter)) ||
          (item.efficiency && item.efficiency.toLowerCase().includes(lowerCaseFilter)) ||
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
          return (typeof value === "number" ? value.toFixed(3) : value.toString())
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
      origin: "My-predictions",
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
  
  const getHistogramData = (isDarkMode) => {
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
  
    const alr1Color = isDarkMode ? "rgba(255, 255, 255, 0.8)" : "rgb(1, 217, 255)";
    const alr1Border = isDarkMode ? "rgb(100, 64, 64)" : "rgb(1, 217, 255)";
    const alr2Color = isDarkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(3, 0, 185, 0.8)";
    const alr2Border = isDarkMode ? "rgb(0, 0, 0)" : "rgba(3, 0, 185, 0.8)";
    const textColor = isDarkMode ? "#FFFFFF" : "#374151";
  
    if (allValues.length === 0) {
      return {
        labels: ["No data"],
        datasets: [
          {
            label: "ALR1",
            data: [0],
            backgroundColor: alr1Color,
            borderColor: alr1Border,
            borderWidth: 1,
          },
          {
            label: "ALR2",
            data: [0],
            backgroundColor: alr2Color,
            borderColor: alr2Border,
            borderWidth: 1,
          },
        ],
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: textColor,
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: textColor,
              },
            },
            y: {
              ticks: {
                color: textColor,
              },
            },
          },
        },
      };
    }
  
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const binSize = (maxValue - minValue) / 10;
  
    const bins = Array.from({ length: 10 }, (_, i) => {
      const start = minValue + i * binSize;
      const end = start + binSize;
      return `${start.toFixed(2)}-${end.toFixed(2)}`;
    });
  
    const alr1Counts = Array(10).fill(0);
    const alr2Counts = Array(10).fill(0);
  
    alr1Values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - minValue) / binSize), 9);
      alr1Counts[binIndex]++;
    });
  
    alr2Values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - minValue) / binSize), 9);
      alr2Counts[binIndex]++;
    });
  
    return {
      labels: bins,
      datasets: [
        {
          label: "ALR1",
          data: alr1Counts,
          backgroundColor: alr1Color,
          borderColor: alr1Border,
          borderWidth: 1,
        },
        {
          label: "ALR2",
          data: alr2Counts,
          backgroundColor: alr2Color,
          borderColor: alr2Border,
          borderWidth: 1,
        },
      ],
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: textColor,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: textColor,
            },
          },
          y: {
            ticks: {
              color: textColor,
            },
          },
        },
      },
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
            backgroundColor: "rgb(14, 56, 240)",
            borderColor: "rgb(14, 56, 240)",
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
          backgroundColor: "rgb(14, 56, 240)",
          borderColor: "rgb(14, 56, 240)",
          borderWidth: 1,
        },
      ],
    };
  };

  const histogramOptions = (isDarkMode) => {
    const textColor = isDarkMode ? "white" : "black";
    return {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: textColor,
          },
        },
        title: {
          display: true,
          text: "Predicted value distribution",
          color: textColor,
        },
      },
      scales: {
        y: {
          min: 0,
          ticks: {
            stepSize: 1,
            color: textColor,
          },
          title: {
            display: true,
            text: "Count",
            color: textColor,
          },
        },
        x: {
          ticks: {
            color: textColor,
          },
          title: {
            display: true,
            text: "Predicted value range",
            color: textColor,
          },
        },
      },
    };
  };  

  const trendOptions = (isDarkMode) => {
    const textColor = isDarkMode ? "white" : "black";
    return {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: textColor,
          },
        },
        title: {
          display: true,
          text: predictions.length === 0 ? "No predictions available" : "Predictions per day",
          color: textColor,
        },
      },
      scales: {
        y: {
          min: 0,
          ticks: {
            stepSize: 1,
            color: textColor,
          },
          title: {
            display: true,
            text: "Number of predictions",
            color: textColor,
          },
        },
        x: {
          ticks: {
            color: textColor,
          },
          title: {
            display: true,
            text: "Date",
            color: textColor,
          },
        },
      },
    };
  };

  if (loading)
    return (
      <div className={`flex min-h-screen`}>
        <Sidebar />
        <main className={`flex-1 p-6 ml-64 ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-white"}`}>
          <div className="rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6">Prediction history</h1>
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
    <div className={`flex min-h-screen ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-white"}`}>
      <Sidebar />
      <main className="flex-1 p-6 ml-64">
      <nav aria-label="breadcrumb" className="mb-4 text-sm font-medium">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center">
              <span>My predictions</span>
            </li>
          </ol>
        </nav>
        <div className={`rounded-lg shadow p-6 ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white"}`}>
          <h1 className="text-2xl font-bold mb-6">
            Prediction history
            <span className="text-sm ml-2">
              ({filteredPredictions.length} predictions)
            </span>
          </h1>

          <div className="mb-6 flex items-start space-x-4">
            <div className="flex-1">
              <label htmlFor="filter" className="text-sm font-medium mb-1 block">
                Filter:
              </label>
              <input
                id="filter"
                type="text"
                value={filterText}
                onChange={handleFilterChange}
                placeholder="Search predictions..."
                className={`w-full px-3 h-11 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-200 border-gray-600 placeholder-gray-400"
                    : "bg-white text-gray-800 border-gray-300 placeholder-gray-500"
                }`}              />
            </div>

            <div>
              <label htmlFor="column" className="text-sm font-medium mb-1 block">
                Column:
              </label>
              <select
                id="column"
                value={filterColumn}
                onChange={handleColumnChange}
                className={`h-11 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-200 border-gray-600"
                    : "bg-white text-gray-800 border-gray-300"
                }`}
              >
                <option value="all">All columns</option>
                <option value="date">Date</option>
                <option value="smiles">SMILES</option>
                <option value="cas">CAS</option>
                <option value="prediction">Prediction</option>
                <option value="efficiency">Efficiency</option>
                <option value="model_name">Enzyme</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="invisible block pointer-events-none select-none" aria-hidden="true">
                Clear
              </label>
              <button
                onClick={handleClearFilter}
                className={`h-11 text-white px-4 rounded hover:bg-blue-600 cursor-pointer ${isDarkMode ? "bg-indigo-500" : "bg-blue-600"}`}
              >
                Clear filter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <Bar data={getHistogramData(isDarkMode)} options={histogramOptions(isDarkMode)} />
            </div>
            <div className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <Bar data={getTrendData(isDarkMode)} options={trendOptions(isDarkMode)} />
            </div>
          </div>

          {!filteredPredictions || filteredPredictions.length === 0 ? (
            <div className="text-center py-4">
              <p>No predictions found.</p>
              <p className="text-sm mt-2">
                {filterText ? "Try adjusting your filter." : "Make some predictions first!"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className={`min-w-full ${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}>
                  <thead>
                    <tr className={`${isDarkMode ? "bg-gray-400" : "bg-gray-100"}`}>
                      <th className="px-6 py-3 text-left text-xs font-mediu uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        SMILES
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        CAS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Prediction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Efficiency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Enzyme
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-gray-200 ${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}>
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
                                : "black",
                          }}
                        >
                          {item.efficiency || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.model_name || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewResult(item)}
                            className={`text-white px-3 py-2 rounded hover:bg-blue-600 cursor-pointer ${isDarkMode ? "bg-indigo-500" : "bg-blue-600"}`}
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