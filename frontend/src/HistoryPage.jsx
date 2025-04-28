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
import { Menu } from "lucide-react";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const HistoryPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [filteredPredictions, setFilteredPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const rowsPerPage = 9;
  const navigate = useNavigate();
  const { currentUser, authLoading } = useAuth();

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
        const q = query(predictionsRef, orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.() || new Date(doc.data().date),
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
      const toSearchableString = (value) => {
        if (value === null || value === undefined) return "";
        if (typeof value === "number") return value.toFixed(3);
        return String(value).toLowerCase();
      };

      if (filterColumn === "all") {
        const dateStr = toSearchableString(formatDate(item.date));
        const smiles = toSearchableString(item.smiles);
        const cas = toSearchableString(item.cas);
        const prediction = toSearchableString(item.prediction);
        const efficiency = toSearchableString(item.efficiency);
        const modelName = toSearchableString(item.model_name);

        return (
          dateStr.includes(lowerCaseFilter) ||
          smiles.includes(lowerCaseFilter) ||
          cas.includes(lowerCaseFilter) ||
          prediction.includes(lowerCaseFilter) ||
          efficiency.includes(lowerCaseFilter) ||
          modelName.includes(lowerCaseFilter)
        );
      } else {
        const value = item[filterColumn];
        if (!value) return false;

        if (filterColumn === "date") {
          const dateStr = formatDate(item.date).toLowerCase();
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
      };
    }
    let minValue, maxValue, binSize, numBins;

    if (allValues.length === 1) {
      const value = allValues[0];
      minValue = value - 0.1;
      maxValue = value + 0.1;
      binSize = 0.2;
      numBins = 1;
    } else if (allValues.length === 2) {
      minValue = Math.min(...allValues);
      maxValue = Math.max(...allValues);
      const range = maxValue - minValue;
      binSize = range > 0 ? range / 2 : 0.2; 
      numBins = 2;
    } else {
      minValue = Math.min(...allValues);
      maxValue = Math.max(...allValues);
      const range = maxValue - minValue;
      binSize = range > 0 ? range / 10 : 0.2; 
      numBins = 10;
    }
  
    const bins = Array.from({ length: numBins  }, (_, i) => {
      const start = minValue + i * binSize;
      const end = start + binSize;
      return `${start.toFixed(2)}-${end.toFixed(2)}`;
    });

    const alr1Counts = Array(10).fill(0);
    const alr2Counts = Array(10).fill(0);

    alr1Values.forEach((value) => {
      const binIndex = Math.min(Math.floor((value - minValue) / binSize), 9);
      alr1Counts[binIndex]++;
    });

    alr2Values.forEach((value) => {
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
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: textColor,
            font: {
              size: window.innerWidth < 640 ? 10 : 12,
            },
          },
        },
        title: {
          display: true,
          text: "Predicted value distribution",
          color: textColor,
          font: {
            size: window.innerWidth < 640 ? 12 : 16,
          },
        },
      },
      scales: {
        y: {
          min: 0,
          ticks: {
            stepSize: 1,
            color: textColor,
            font: {
              size: window.innerWidth < 640 ? 8 : 10,
            },
          },
          title: {
            display: true,
            text: "Count",
            color: textColor,
            font: {
              size: window.innerWidth < 640 ? 10 : 12,
            },
          },
        },
        x: {
          ticks: {
            color: textColor,
            font: {
              size: window.innerWidth < 640 ? 8 : 10,
            },
          },
          title: {
            display: true,
            text: "Predicted value range",
            color: textColor,
            font: {
              size: window.innerWidth < 640 ? 10 : 12,
            },
          },
        },
      },
    };
  };

  const trendOptions = (isDarkMode) => {
    const textColor = isDarkMode ? "white" : "black";
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: textColor,
            font: {
              size: window.innerWidth < 640 ? 10 : 12,
            },
          },
        },
        title: {
          display: true,
          text: predictions.length === 0 ? "No predictions available" : "Predictions per day",
          color: textColor,
          font: {
            size: window.innerWidth < 640 ? 12 : 16,
          },
        },
      },
      scales: {
        y: {
          min: 0,
          ticks: {
            stepSize: 1,
            color: textColor,
            font: {
              size: window.innerWidth < 640 ? 8 : 10,
            },
          },
          title: {
            display: true,
            text: "Number of predictions",
            color: textColor,
            font: {
              size: window.innerWidth < 640 ? 10 : 12,
            },
          },
        },
        x: {
          ticks: {
            color: textColor,
            font: {
              size: window.innerWidth < 640 ? 8 : 10,
            },
          },
          title: {
            display: true,
            text: "Date",
            color: textColor,
            font: {
              size: window.innerWidth < 640 ? 10 : 12,
            },
          },
        },
      },
    };
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-white"}`}>
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main
          className={`flex-1 p-4 sm:p-6 transition-all duration-300 ${
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
          <div
            className={`rounded-lg shadow p-4 sm:p-6 ${
              isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white"
            }`}
          >
            <h1
              className={`text-xl sm:text-2xl font-bold mb-6 ${
                isDarkMode ? "text-gray-200" : "text-gray-800"
              }`}
            >
              Prediction history
            </h1>
            <div className="text-center py-4">
              <div className="relative inline-block w-32 sm:w-40 h-12 sm:h-14">
                <span
                  className="text-3xl sm:text-4xl animate-mouse-scurry"
                  style={{
                    display: "inline-block",
                    animation: "mouse-scurry 2s ease-in-out infinite !important",
                    transformOrigin: "center",
                  }}
                >
                  🐁
                </span>
                <span
                  className="text-lg sm:text-xl text-yellow-400 absolute top-0 right-[-1.5rem] sm:right-[-2rem] opacity-0 animate-cheese-pop"
                  style={{
                    animation: "cheese-pop 2s ease-in-out infinite !important",
                    animationDelay: "0.5s",
                  }}
                >
                  🧀
                </span>
              </div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Trying to fetch prediction history...
              </p>
            </div>
          </div>
        </main>
        <ToastContainer closeButton={false} theme={isDarkMode ? "dark" : "light"} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-white"}`}>
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main
          className={`flex-1 p-4 sm:p-6 transition-all duration-300 ${
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
          <div
            className={`rounded-lg shadow p-4 sm:p-6 ${
              isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white"
            }`}
          >
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        </main>
        <ToastContainer closeButton={false} theme={isDarkMode ? "dark" : "light"} />
      </div>
    );
  }

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredPredictions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPredictions.length / rowsPerPage);

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
                My predictions
              </span>
            </li>
          </ol>
        </nav>
        <div
          className={`rounded-lg shadow p-4 sm:p-6 ${
            isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white"
          }`}
        >
          <h1
            className={`text-xl sm:text-2xl font-bold mb-6 ${
              isDarkMode ? "text-gray-200" : "text-gray-800"
            }`}
          >
            Prediction history
            <span className="text-sm ml-2">({filteredPredictions.length} predictions)</span>
          </h1>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <label
                htmlFor="filter"
                className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300"
              >
                Filter:
              </label>
              <input
                id="filter"
                type="text"
                value={filterText}
                onChange={handleFilterChange}
                placeholder="Search predictions..."
                className={`h-11 w-full px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-200 border-gray-600 placeholder-gray-400"
                    : "bg-white text-gray-800 border-gray-300 placeholder-gray-500"
                }`}
              />
            </div>
            <div className="w-full sm:w-48">
              <label
                htmlFor="column"
                className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300"
              >
                Column:
              </label>
              <select
                id="column"
                value={filterColumn}
                onChange={handleColumnChange}
                className={`h-11 w-full px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
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
            <div className="w-full sm:w-32 self-start">
              <label
                htmlFor="clear-filter"
                className="text-sm font-medium mb-1 block text-transparent"
              >
                Placeholder
              </label>
              <button
                id="clear-filter"
                onClick={handleClearFilter}
                className={`h-11 w-full text-white px-4 rounded text-sm sm:text-base hover:bg-blue-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-blue-500`}
                aria-label="Clear filter"
              >
                Clear filter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div
              className={`p-4 rounded-lg shadow h-64 sm:h-80 ${
                isDarkMode ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <Bar data={getHistogramData(isDarkMode)} options={histogramOptions(isDarkMode)} />
            </div>
            <div
              className={`p-4 rounded-lg shadow h-64 sm:h-80 ${
                isDarkMode ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <Bar data={getTrendData(isDarkMode)} options={trendOptions(isDarkMode)} />
            </div>
          </div>

          {!filteredPredictions || filteredPredictions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600 dark:text-gray-400">No predictions found.</p>
              <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                {filterText ? "Try adjusting your filter." : "Make some predictions first!"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table
                  className={`min-w-full ${
                    isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white"
                  }`}
                >
                  <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        SMILES
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
                        CAS
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Prediction
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">
                        Efficiency
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell">
                        Enzyme
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300 dark:divide-gray-600">
                    {currentItems.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(item.date).toLocaleDateString("de-DE", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                          {item.smiles}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell">
                          {item.cas || "-"}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                          {item.model_name === "ALR1"
                            ? `${(item.prediction * 100).toFixed(3)}%`
                            : item.prediction}
                        </td>
                        <td
                          className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell"
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
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                          {item.model_name || "-"}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewResult(item)}
                            className={`text-white px-2 sm:px-3 py-1 sm:py-2 rounded hover:bg-blue-700 text-xs sm:text-sm cursor-pointer ${
                              isDarkMode ? "bg-indigo-500" : "bg-blue-600"
                            }`}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteResult(item)}
                            className="bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded hover:bg-red-700 ml-2 text-xs sm:text-sm cursor-pointer"
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
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {(() => {
                    const pages = [];
                    const visiblePages = window.innerWidth < 640 ? 3 : 4;
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
                        <span
                          key={item + index}
                          className="px-2 sm:px-3 py-1 text-gray-600 dark:text-gray-400"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item)}
                          className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
                            currentPage === item
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 cursor-pointer"
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
      <ToastContainer closeButton={false} theme={isDarkMode ? "dark" : "light"} />
    </div>
  );
};

export default HistoryPage;