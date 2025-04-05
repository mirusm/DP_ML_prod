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
  const [showDescriptorPopup, setShowDescriptorPopup] = useState(false);
  const [isClickedPopup, setIsClickedPopup] = useState(false);
  const [descriptorInfo, setDescriptorInfo] = useState("");
  const [descriptorKey, setDescriptorKey] = useState("");
  const [activeTab, setActiveTab] = useState("ALR1"); 
  const resultsPerPage = 5;

  const formatNumber = (num, decimals = 4) => {
    if (num === null || num === undefined) return "N/A";
    const number = Number(num);
    return isNaN(number) ? "N/A" : number.toFixed(decimals);
  };

  const alr2Results = results.filter((result) => result.model === "ALR2");
  const alr1Results = results.filter((result) => result.model === "ALR1");

  const currentResults = activeTab === "ALR1" ? alr1Results: alr2Results;
  const totalPages = Math.ceil(currentResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const paginatedResults = currentResults.slice(startIndex, endIndex);

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
      setShowDescriptorPopup(false);
      setIsClickedPopup(false);
      setDescriptorInfo("");
      setDescriptorKey("");
    }
  };

  const descriptorDescriptions = {
    MaxAbsEStateIndex: `MaxAbsEStateIndex: Returns a tuple of EState indices for the molecule, Reference: Hall, Mohney and Kier. JCICS 31 76-81 (1991).`,
    MinEStateIndex: `MinEStateIndex: Returns a tuple of EState indices for the molecule, Reference: Hall, Mohney and Kier. JCICS 31 76-81 (1991).`,
    SPS: `SPS: Spanning Tree Score, a topological descriptor in RDKit that measures the complexity of the molecular graph based on the number of spanning trees. It reflects the molecule's structural complexity and connectivity.`,
    MolWt: `Molecular Weight (MolWt): The average molecular weight of the molecule.`,
    BCUT2D_MWHI: `BCUT2D_MWHI: A 2D BCUT descriptor based on molecular weight and atomic charges. BCUT descriptors are eigenvalues of a modified adjacency matrix, capturing atomic properties like mass and charge. MWHI refers to the highest eigenvalue for molecular weight. Useful for encoding structural and electronic information in QSAR models.`,
    HallKierAlpha: `HallKierAlpha: The Hall-Kier alpha value for a molecule. Rev. Comput. Chem. 2:367-422 (1991).`,
    PEOE_VSA1: `PEOE_VSA1: MOE(Molecular Operating Environment) Charge VSA Descriptor 1 (-inf < x < -0.30).`,
    PEOE_VSA10: `PEOE_VSA10: MOE Charge VSA Descriptor.`,
    PEOE_VSA11: `PEOE_VSA11: MOE Charge VSA Descriptor 11 ( 0.15 <= x < 0.20).`,
    PEOE_VSA12: `PEOE_VSA12: MOE Charge VSA Descriptor 12 ( 0.20 <= x < 0.25).`,
    PEOE_VSA13: `PEOE_VSA13: MOE Charge VSA Descriptor 13 ( 0.25 <= x < 0.30).`,
    PEOE_VSA2: `PEOE_VSA2: MOE Charge VSA Descriptor 2 (-0.30 <= x < -0.25).`,
    PEOE_VSA3: `PEOE_VSA3: MOE Charge VSA Descriptor 3 (-0.25 <= x < -0.20).`,
    PEOE_VSA4: `PEOE_VSA4: MOE Charge VSA Descriptor 4 (-0.20 <= x < -0.15).`,
    PEOE_VSA5: `PEOE_VSA5: MOE Charge VSA Descriptor 5 (-0.15 <= x < -0.10).`,
    PEOE_VSA6: `PEOE_VSA6: MOE Charge VSA Descriptor 6 (-0.10 <= x < -0.05).`,
    PEOE_VSA8: `PEOE_VSA8: MOE Charge VSA Descriptor 8 ( 0.00 <= x < 0.05).`,
    SMR_VSA1: `SMR_VSA1: MOE MR VSA Descriptor 1 (-inf < x < 1.29).`,
    SMR_VSA2: `SMR_VSA2: MOE MR VSA Descriptor 2 ( 1.29 <= x < 1.82).`,
    SMR_VSA3: `SMR_VSA3: MOE MR VSA Descriptor 3 ( 1.82 <= x < 2.24).`,
    SMR_VSA4: `SMR_VSA4: MOE MR VSA Descriptor 4 ( 2.24 <= x < 2.45).`,
    SMR_VSA5: `SMR_VSA5: MOE MR VSA Descriptor 5 ( 2.45 <= x < 2.75).`,
    SMR_VSA6: `SMR_VSA6: MOE MR VSA Descriptor 6 ( 2.75 <= x < 3.05).`,
    SMR_VSA7: `SMR_VSA7: MOE MR VSA Descriptor 7 ( 3.05 <= x < 3.63).`,
    SMR_VSA9: `SMR_VSA9: MOE MR VSA Descriptor 9 ( 3.80 <= x < 4.00).`,
    SlogP_VSA1: `SlogP_VSA1: MOE logP VSA Descriptor 1 (-inf < x < -0.40).`,
    SlogP_VSA2: `SlogP_VSA2: MOE logP VSA Descriptor 2 (-0.40 <= x < -0.20).`,
    SlogP_VSA3: `SlogP_VSA3: MOE logP VSA Descriptor 3 (-0.20 <= x < 0.00).`,
    SlogP_VSA4: `SlogP_VSA4: MOE logP VSA Descriptor 4 ( 0.00 <= x < 0.10).`,
    SlogP_VSA5: `SlogP_VSA5: MOE logP VSA Descriptor 5 ( 0.10 <= x < 0.15).`,
    SlogP_VSA7: `SlogP_VSA7: MOE logP VSA Descriptor 7 ( 0.20 <= x < 0.25).`,
    SlogP_VSA8: `SlogP_VSA8: MOE logP VSA Descriptor 8 ( 0.25 <= x < 0.30).`,
    TPSA: `TPSA: The polar surface area (PSA) or topological polar surface area (TPSA) of a molecule is defined as the surface sum over all polar atoms or molecules, primarily oxygen and nitrogen, also including their attached hydrogen atoms. PSA is a commonly used medicinal chemistry metric for the optimization of a drug's ability to permeate cells.`,
    EState_VSA2: `EState_VSA2: EState VSA Descriptor 2 ( -0.39 <= x < 0.29).`,
    EState_VSA3: `EState_VSA3: EState VSA Descriptor 3 ( 0.29 <= x < 0.72).`,
    EState_VSA4: `EState_VSA4: EState VSA Descriptor 4 ( 0.72 <= x < 1.17).`,
    EState_VSA5: `EState_VSA5: EState VSA Descriptor 5 ( 1.17 <= x < 1.54).`,
    EState_VSA6: `EState_VSA6: EState VSA Descriptor 6 ( 1.54 <= x < 1.81).`,
    EState_VSA7: `EState_VSA7: EState VSA Descriptor 7 ( 1.81 <= x < 2.05).`,
    EState_VSA8: `EState_VSA8: EState VSA Descriptor 8 ( 2.05 <= x < 4.69).`,
    EState_VSA9: `EState_VSA9: EState VSA Descriptor 9 ( 4.69 <= x < 9.17).`,
    VSA_EState2: `VSA_EState2: VSA EState Descriptor 2 ( 4.78 <= x < 5.00).`,
    VSA_EState3: `VSA_EState3: VSA EState Descriptor 3 ( 5.00 <= x < 5.41).`,
    VSA_EState4: `VSA_EState4: VSA EState Descriptor 4 ( 5.41 <= x < 5.74).`,
    VSA_EState5: `VSA_EState5: VSA EState Descriptor 5 ( 5.74 <= x < 6.00).`,
    VSA_EState7: `VSA_EState7: VSA EState Descriptor 7 ( 6.07 <= x < 6.45).`,
    VSA_EState9: `VSA_EState9: VSA EState Descriptor 9 ( 7.00 <= x < 11.00).`,
    NHOHCount: `NHOHCount: Number of NHs and OHs.`,
    NumAmideBonds: `NumAmideBonds: The number of amide bonds (C(O)-N) in the molecule. Amide bonds are common in peptides and drugs, influencing stability, hydrogen bonding, and pharmacokinetic properties.`,
    fr_NH1: `fr_NH1: Number of Secondary amines.`,
    fr_alkyl_halide: `fr_alkyl_halide: Number of alkyl halides.`,
    fr_aryl_methyl: `fr_aryl_methyl: Number of aryl methyl sites for hydroxylation.`,
    fr_ketone: `fr_ketone: Number of ketones.`,
    fr_para_hydroxylation: `fr_para_hydroxylation: Number of para-hydroxylation sites.`,
    default: `This is a molecular descriptor calculated using RDKit. It represents a feature of the molecule used in the prediction model. Specific details depend on the descriptor type. For more information, refer to RDKit documentation or the model's feature definitions.`,
  };


  const handleShowDescriptorInfoHover = (key) => {
    if (!isClickedPopup) {
      const info = descriptorDescriptions[key] || descriptorDescriptions.default;
      setDescriptorInfo(info);
      setDescriptorKey(key);
      setShowDescriptorPopup(true);
    }
  };

  const handleShowDescriptorInfoClick = (key) => {
    const info = descriptorDescriptions[key] || descriptorDescriptions.default;
    setDescriptorInfo(info);
    setDescriptorKey(key);
    setShowDescriptorPopup(true);
    setIsClickedPopup(true);
  };

  const handleHideDescriptorInfo = () => {
    if (!isClickedPopup) {
      setShowDescriptorPopup(false);
      setDescriptorInfo("");
      setDescriptorKey("");
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
            <h2 className="text-2xl font-bold text-blue-700">
              Prediction result details - {selectedResult.model || selectedResult.model_name}
            </h2>
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
                      <div key={key} className="border border-blue-600 rounded p-2 relative">
                        <div className="flex items-center">
                          <span className="font-semibold">{key}:</span>
                          <span
                            onMouseEnter={() => handleShowDescriptorInfoHover(key)}
                            onMouseLeave={handleHideDescriptorInfo}
                            onClick={() => handleShowDescriptorInfoClick(key)}
                            className="text-red-600 hover:text-red-800 cursor-pointer ml-2 font-bold"
                            aria-label={`Show information about ${key}`}
                          >
                            i
                          </span>
                        </div>
                        <div className="ml-4">
                          <p>Value: {formatNumber(descriptor.value)}</p>
                          <p>Importance: {formatNumber(descriptor.importance)}</p>
                        </div>
                        {!isClickedPopup && showDescriptorPopup && descriptorKey === key && descriptorInfo && (
                          <div className="absolute z-10 bg-white p-4 rounded-lg shadow-md max-w-md w-96 text-gray-800 border border-gray-200 -top-2 left-full ml-2">
                            <p className="whitespace-pre-wrap break-words">{descriptorInfo}</p>
                          </div>
                        )}
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

          {isClickedPopup && showDescriptorPopup && descriptorInfo && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={handleClosePopup}
            >
              <div className="bg-white p-4 rounded-lg shadow-md max-w-md w-full text-gray-800">
                <p className="whitespace-pre-wrap break-words">{descriptorInfo}</p>
              </div>
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

        {/* Tabs for ALR2 and ALR1 */}
        
        <div className="mb-6">
          <button
            className={`px-4 py-2 rounded ${activeTab === "ALR1" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
            onClick={() => {
              setActiveTab("ALR1");
              setCurrentPage(1);
            }}
          >
            ALR1 Results
          </button>
          <button
            className={`px-4 py-2 mr-2 rounded ${activeTab === "ALR2" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
            onClick={() => {
              setActiveTab("ALR2");
              setCurrentPage(1);
            }}
          >
            ALR2 Results
          </button>
        </div>

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
                      className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
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