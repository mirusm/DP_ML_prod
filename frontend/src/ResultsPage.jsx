import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import PropertyDisplay from "./PropertyDisplay";

const ResultPage = () => {
  const location = useLocation();
  const results = location.state?.results || [];
  const singleResult = location.state && !location.state.results ? location.state : null;
  const origin = location.state?.origin || "history";
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResult, setSelectedResult] = useState(singleResult);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState("");
  const resultsPerPage = 5;

  const formatNumber = (num, decimals = 4) => {
    if (num === null || num === undefined) return "N/A";
    const number = Number(num);
    return isNaN(number) ? "N/A" : number.toFixed(decimals);
  };

  const totalPages = Math.ceil(results.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const paginatedResults = results.slice(startIndex, endIndex);

  const formatFormula = (formula) => {
    if (!formula) return "N/A";
    const parts = formula.match(/([A-Za-z]+)(\d*)/g) || [];
    return parts.map((part, index) => {
      const element = part.match(/[A-Za-z]+/)[0];
      const number = part.match(/\d+/)?.[0] || "";
      return (
        <span key={index}>
          {element}
          {number && <sub>{number}</sub>}
        </span>
      );
    });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleViewDetails = (result) => {
    setSelectedResult(result);
  };

  const handleBackToList = () => {
    setSelectedResult(null);
  };

  const handleImageClick = (imageSrc) => {
    setPopupImageSrc(imageSrc);
    setShowImagePopup(true);
  };

  const handleClosePopup = (e) => {
    if (e.target === e.currentTarget) {
      setShowImagePopup(false);
      setPopupImageSrc("");
    }
  };

  if (!singleResult && (!results || results.length === 0)) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="container mx-auto p-4">
          <h2 className="text-2xl font-bold text-red-600">No data available</h2>
          <Link
            to="/"
            className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (selectedResult) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 p-6 ml-64 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-700">Prediction result details</h2>
            {results.length > 0 && (
              <button
                onClick={handleBackToList}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Back to results list
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold mb-2 text-green-600">Basic information</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">SMILES:</span> {selectedResult.smiles || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Canonical SMILES:</span>{" "}
                    {selectedResult.info?.canonical_smiles || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Formula:</span>{" "}
                    {formatFormula(selectedResult.info?.formula || "N/A")}
                  </p>
                  <p>
                    <span className="font-semibold">CAS:</span> {selectedResult.cas || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Prediction:</span>{" "}
                    {formatNumber(selectedResult.predictedValue || "N/A")}
                  </p>
                  <p>
                    <span className="font-semibold">Efficiency:</span>{" "}
                    <span
                      style={{
                        color: selectedResult.efficiency === "Effective" ? "green" : "red",
                      }}
                    >
                      {selectedResult.efficiency || "N/A"}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">IUPAC name:</span>{" "}
                    {selectedResult.info?.iupac_name || "N/A"}
                  </p>
                </div>
              </div>

              {selectedResult.properties && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-bold mb-2 text-green-600">Molecular properties</h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Num. heavy atoms:</span>{" "}
                      {selectedResult.numHeavyAtoms || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Num. aromatic atoms:</span>{" "}
                      {selectedResult.properties.num_aromatic_atoms || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Molecular weight:</span>{" "}
                      {formatNumber(selectedResult.properties.molecular_weight, 2) || "N/A"} g/mol
                    </p>
                    <p>
                      <span className="font-semibold">Molar refractivity:</span>{" "}
                      {formatNumber(selectedResult.properties.molar_refractivity, 2) || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Num. rotatable bonds:</span>{" "}
                      {selectedResult.properties.num_rotatable_bonds || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Num. H-bond acceptors:</span>{" "}
                      {selectedResult.properties.num_hbond_acceptors || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Num. H-bond donors:</span>{" "}
                      {selectedResult.properties.num_hbond_donors || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">TPSA:</span>{" "}
                      {formatNumber(selectedResult.properties.tpsa, 2) || "N/A"} Å²
                    </p>
                    <PropertyDisplay data={selectedResult} />
                  </div>
                </div>
              )}

              {selectedResult.descriptors && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-bold mb-2 text-green-600">Molecular descriptors</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedResult.descriptors).map(([key, descriptor]) => (
                      <div key={key}>
                        <p>
                          <span className="font-semibold">{key}:</span>
                          <br />
                          Value: {formatNumber(descriptor.value)}
                          <br />
                          Importance: {formatNumber(descriptor.importance)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {selectedResult.moleculeImage && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-bold mb-2 text-green-600">Molecule structure</h3>
                  <img
                    src={`data:image/png;base64,${selectedResult.moleculeImage}`}
                    alt="Molecule structure"
                    className="w-full cursor-pointer"
                    onClick={() => handleImageClick(`data:image/png;base64,${selectedResult.moleculeImage}`)}
                  />
                </div>
              )}

              {selectedResult.shap_plot && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-bold mb-2 text-green-600">SHAP analysis - Top features</h3>
                  <img
                    src={`data:image/png;base64,${selectedResult.shap_plot}`}
                    alt="SHAP plot - top features"
                    className="w-full cursor-pointer"
                    onClick={() => handleImageClick(`data:image/png;base64,${selectedResult.shap_plot}`)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-white">
            <Link
              to={origin === "dashboard" ? "/dashboard" : "/my-predictions"}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {origin === "dashboard" ? "Back to dashboard" : "Back to history"}
            </Link>
          </div>

          {showImagePopup && popupImageSrc && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={handleClosePopup}
            >
              <img
                src={popupImageSrc}
                alt="Zoomed image"
                className="max-w-3xl max-h-3xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-6 ml-64 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Prediction results</h2>

        <div className="bg-white rounded-lg shadow p-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-gray-600">Date</th>
                <th className="p-2 text-gray-600">SMILES</th>
                <th className="p-2 text-gray-600">CAS</th>
                <th className="p-2 text-gray-600">Predicted value</th>
                <th className="p-2 text-gray-600">Efficiency</th>
                <th className="p-2 text-gray-600">Num. heavy atoms</th>
                <th className="p-2 text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.map((result, index) => (
                <tr key={index}>
                  <td className="p-2 text-gray-800">{result.date}</td>
                  <td className="p-2 text-gray-800">{result.smiles}</td>
                  <td className="p-2 text-gray-800">{result.cas || "-"}</td>
                  <td className="p-2 text-gray-800">{result.predictedValue}</td>
                  <td
                    className="p-2 text-gray-800"
                    style={{
                      color: result.efficiency === "Effective" ? "green" : "red",
                    }}
                  >
                    {result.efficiency}
                  </td>
                  <td className="p-2 text-gray-800">{result.numHeavyAtoms}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleViewDetails(result)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded text-white ${
                currentPage === 1
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded text-white ${
                currentPage === totalPages
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Next
            </button>
          </div>
        </div>

        <div className="mt-6 text-white">
          <Link
            to="/new-prediction"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to new prediction
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;