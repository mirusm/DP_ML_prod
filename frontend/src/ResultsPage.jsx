import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import PropertyDisplay from "./PropertyDisplay";
import { Menu } from "lucide-react";

const ResultPage = () => {
  const CLASSIFICATION_MODELS = ["ALR1", "AKR1C1", "AKR1C2", "AKR1C3"];
  const TAB_MODELS = ["ALR1", "ALR2", "AKR1C1", "AKR1C2", "AKR1C3"];
  const TAB_LABELS = {
    ALR1: "ALR1 Results",
    ALR2: "ALR2 Results",
    AKR1C1: "AKR1C1 Results",
    AKR1C2: "AKR1C2 Results",
    AKR1C3: "AKR1C3 Results",
  };
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const resultsPerPage = 5;
  const navigate = useNavigate();

  const isClassificationModel = (modelName) =>
    CLASSIFICATION_MODELS.includes((modelName || "").toUpperCase());

  useEffect(() => {
    const handleThemeChange = (e) => {
      setIsDarkMode(e.detail.isDark);
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  const handleNavigation = () => {
    const destination = origin === "dashboard" ? "/dashboard" : "/my-predictions";
    navigate(destination);
  };

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return "N/A";
    const number = Number(num);
    return isNaN(number) ? "N/A" : number.toFixed(decimals);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

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

  const normalizedResults = results.map((result) => ({
    ...result,
    model: result.model || result.model_name || "N/A",
    predictedValue: result.predictedValue || result.prediction,
  }));

  const availableModels = Array.from(
    new Set(
      normalizedResults
        .map((result) => (result.model || "").toUpperCase())
        .filter(Boolean)
    )
  );

  const visibleTabModels = (() => {
    if (origin.startsWith("new-prediction-akrc")) {
      return availableModels.filter((model) => model.startsWith("AKR"));
    }
    if (origin === "new-prediction") {
      return availableModels.filter((model) => model.startsWith("ALR"));
    }
    return TAB_MODELS.filter((model) => availableModels.includes(model));
  })();

  useEffect(() => {
    if (selectedResult || normalizedResults.length === 0) return;
    if (visibleTabModels.length > 0 && !visibleTabModels.includes(activeTab)) {
      setActiveTab(visibleTabModels[0]);
      setCurrentPage(1);
    }
  }, [activeTab, normalizedResults, selectedResult, visibleTabModels]);

  const modelResults = visibleTabModels.reduce((acc, modelName) => {
    acc[modelName] = normalizedResults.filter(
      (result) => result.model.toUpperCase() === modelName
    );
    return acc;
  }, {});
  const currentResults = modelResults[activeTab] || [];
  const totalPages = Math.ceil(currentResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const paginatedResults = currentResults.slice(startIndex, endIndex);

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

  const exportResultToCSV = () => {
    if (!selectedResult) return;

    const basicInfo = {
      SMILES: selectedResult.smiles || "N/A",
      Canonical_SMILES: selectedResult.info?.canonical_smiles || "N/A",
      Formula: selectedResult.info?.formula || "N/A",
      CAS: selectedResult.cas || "N/A",
      Prediction:
      isClassificationModel(selectedResult.model || selectedResult.model_name)
        ? `${formatNumber((selectedResult.predictedValue || selectedResult.prediction || 0) * 100)}%`
        : formatNumber(selectedResult.predictedValue || selectedResult.prediction || 0),
      Efficiency: selectedResult.efficiency || "N/A",
      IUPAC_name: selectedResult.info?.iupac_name || "N/A",
      Model: selectedResult.model || selectedResult.model_name || "N/A",
    };

    const properties = selectedResult.properties || {};
    const descriptors = selectedResult.descriptors || {};

    let csvContent = "Category,Key,Value\n";
    Object.entries(basicInfo).forEach(([key, value]) => {
      csvContent += `Basic Info,${key},${value}\n`;
    });
    Object.entries(properties).forEach(([key, value]) => {
      csvContent += `Properties,${key},${value}\n`;
    });
    Object.entries(descriptors).forEach(([key, descriptor]) => {
      csvContent += `Descriptors,${key}_value,${descriptor.value}\n`;
      csvContent += `Descriptors,${key}_importance,${descriptor.importance}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `compound_result_${basicInfo.Model}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const getPredictionColorClass = (model, value) => {
    const val = value || 0;
    if (isClassificationModel(model)) {
      if (val < 0.5645) return 'bg-red-500';
      if (val < 0.75) return 'bg-orange-500';
      if (val < 0.9) return 'bg-yellow-500';
      return 'bg-green-500';
    } else {
      if (val < 10) return 'bg-green-500';
      if (val < 20) return 'bg-green-400';
      if (val < 30) return 'bg-yellow-400';
      if (val < 60) return 'bg-orange-400';
      if (val < 70) return 'bg-orange-500';
      if (val < 80) return 'bg-red-400';
      if (val < 90) return 'bg-red-500';
      return 'bg-red-600';
    }
  };

  if (!singleResult && (!results || results.length === 0)) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-gray-100"}`}>
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main
          className={`flex-1 p-4 sm:p-6 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-0"
          } md:ml-64 ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-gray-100"}`}
        >
          <button
            className="md:hidden mb-4 p-2 rounded-lg bg-blue-600 text-white"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className={`rounded-lg shadow p-4 sm:p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className="text-xl sm:text-2xl font-bold text-red-600">No results available</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
              No prediction results were found. Try running a new prediction{" "}
              <Link to="/new-prediction" className="text-blue-600 hover:underline">
                here
              </Link>.
            </p>
            <Link
              to="/dashboard"
              className="mt-4 inline-block bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded text-sm sm:text-base hover:bg-blue-600"
            >
              Back to dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (selectedResult) {
    if (!selectedResult.origin) {
      selectedResult.origin = " ";
    }
    return (
      <div className={`flex min-h-screen ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-white"}`}>
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main
          className={`flex-1 p-4 sm:p-6 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-0"
          } md:ml-64 overflow-y-auto ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-white"}`}
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
            <ol className="list-none p-0 inline-flex flex-wrap">
              <li className="flex items-center">
                <Link
                  to={`/${selectedResult.origin.toLowerCase()}`}
                  className="hover:text-blue-600 cursor-pointer truncate max-w-[150px] sm:max-w-none"
                >
                  {selectedResult.origin.replace(/-/g, " ")}
                </Link>
                <span className="mx-1 sm:mx-2">/</span>
              </li>
              <li className="flex items-center">
                <span>Result</span>
              </li>
            </ol>
          </nav>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
            <h2
              className={`text-xl sm:text-2xl font-bold ${
                isDarkMode ? "text-gray-200" : "text-blue-600"
              }`}
            >
              Result details - {selectedResult.model || selectedResult.model_name || "Unknown"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {results.length > 0 && (
                <button
                  onClick={handleBackToList}
                  className="bg-gray-700 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base hover:bg-gray-800 cursor-pointer"
                >
                  Back to results list
                </button>
              )}
              <button
                onClick={handleNavigation}
                className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base hover:bg-blue-600 cursor-pointer"
              >
                {origin === "dashboard" ? "Back to dashboard" : "Back to history"}
              </button>
              <button
                onClick={exportResultToCSV}
                className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base hover:bg-green-700 cursor-pointer"
              >
                Export to CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4 sm:space-y-6">
              <div className={`rounded-lg shadow overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className="bg-blue-600 text-white p-3">
                  <h3 className="font-bold text-sm sm:text-base">Basic information</h3>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="space-y-2 text-sm sm:text-base">
                    <p>
                      <span className="font-semibold">SMILES:</span>{" "}
                      <span className="break-all">{selectedResult.smiles || "N/A"}</span>
                    </p>
                    <p>
                      <span className="font-semibold">Canonical SMILES:</span>{" "}
                      <span className="break-all">
                        {selectedResult.info?.canonical_smiles || "N/A"}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold">CAS:</span> {selectedResult.cas || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">IUPAC name:</span>{" "}
                      <span className="break-words">
                        {selectedResult.info?.iupac_name || "N/A"}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold">Formula:</span>{" "}
                      {formatFormula(selectedResult.info?.formula || "N/A")}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div
                      className={`w-20 sm:w-24 h-20 sm:h-24 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl mb-2 ${getPredictionColorClass(
                        selectedResult.model || selectedResult.model_name,
                        selectedResult.predictedValue || selectedResult.prediction
                      )}`}
                    >
                      {isClassificationModel(selectedResult.model || selectedResult.model_name)
                        ? `${formatNumber((selectedResult.predictedValue || selectedResult.prediction || 0) * 100)}%`
                        : formatNumber(selectedResult.predictedValue || selectedResult.prediction || 0)}
                    </div>
                    <p
                      className={`font-semibold text-sm sm:text-base text-center ${
                        selectedResult.efficiency === "Effective" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {selectedResult.efficiency || "N/A"}
                    </p>
                    <p className={`font-semibold text-sm sm:text-base text-center ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                      {isClassificationModel(selectedResult.model || selectedResult.model_name)
                        ? "(Confidence score)"
                        : "(Predicted value)"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedResult.properties && (
                <div className={`rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                  <div className="bg-blue-600 text-white p-3">
                    <h3 className="font-bold text-sm sm:text-base">Molecular properties</h3>
                  </div>
                  <div className="space-y-2 p-4 text-sm sm:text-base">
                    <p>
                      <span className="font-semibold">Num. heavy atoms:</span>{" "}
                      {selectedResult.numHeavyAtoms ||
                        selectedResult.properties.num_heavy_atoms ||
                        "N/A"}
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
                <div className={`rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                  <div className="bg-blue-600 text-white p-3">
                    <h3 className="font-bold text-sm sm:text-base">Molecular descriptors</h3>
                  </div>
                  <div className="space-y-2 p-4 text-sm sm:text-base">
                    {Object.entries(selectedResult.descriptors).map(([key, descriptor]) => (
                      <div key={key} className="border border-blue-600 rounded p-2 relative">
                        <div className="flex items-center">
                          <span className="font-semibold">{key}:</span>
                          <span
                            onMouseEnter={() => handleShowDescriptorInfoHover(key)}
                            onMouseLeave={handleHideDescriptorInfo}
                            onClick={() => handleShowDescriptorInfoClick(key)}
                            className="text-red-600 hover:text-red-800 cursor-pointer ml-2 font-bold text-xs sm:text-sm"
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
                          <div
                            className={`absolute z-20 p-3 rounded-lg shadow-md w-56 sm:w-64 text-gray-800 border border-gray-200 ${
                              isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white"
                            }`}
                            style={{
                              top: "0",
                              left: "60%",
                              marginLeft: "0.5rem",
                            }}
                          >
                            <p className="whitespace-pre-wrap break-words text-xs sm:text-sm">
                              {descriptorInfo}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 sm:space-y-6">
              {selectedResult.molecule_image && (
                <div className="bg-white rounded-t-lg shadow overflow-hidden">
                  <div className={`text-white p-3 ${isDarkMode ? "bg-blue-600" : "bg-blue-600"}`}>
                    <h3 className="font-bold">Molecular structure</h3>
                  </div>
                  <img
                    src={`data:image/png;base64,${selectedResult.molecule_image}`}
                    alt="Molecule structure"
                    className="w-3/4 cursor-pointer mx-auto"
                    onClick={() => handleImageClick(`data:image/png;base64,${selectedResult.molecule_image}`)}
                    onError={() => console.error("Failed to load molecule image")}
                  />
                </div>
              )}

              {selectedResult.shap_plot && (
                <div className="bg-white rounded-t-lg shadow">
                  <div className={`text-white p-3 ${isDarkMode ? "bg-blue-600" : "bg-blue-600"}`}>
                    <h3 className="font-bold">SHAP Explainability</h3>
                  </div>
                  <img
                    src={`data:image/png;base64,${selectedResult.shap_plot}`}
                    alt="SHAP plot - top features"
                    className="w-full cursor-pointer"
                    onClick={() => handleImageClick(`data:image/png;base64,${selectedResult.shap_plot}`)}
                    onError={() => console.error("Failed to load SHAP plot")}
                  />
                </div>
              )}
            </div>
          </div>

          {showImagePopup && popupImageSrc && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={handleClosePopup}
            >
              <img
                src={popupImageSrc}
                alt="Zoomed image"
                className="max-w-[90vw] max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {isClickedPopup && showDescriptorPopup && descriptorInfo && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={handleClosePopup}
            >
              <div
                className={`p-4 sm:p-6 rounded-lg shadow-md max-w-[90vw] sm:max-w-md w-full ${
                  isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-800"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{descriptorInfo}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-white"}`}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main
        className={`flex-1 p-4 sm:p-6 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        } md:ml-64 overflow-y-auto ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-white"}`}
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
          <ol className="list-none p-0 inline-flex flex-wrap">
            <li className="flex items-center">
              <span>Results</span>
            </li>
          </ol>
        </nav>
        <h2
          className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${
            isDarkMode ? "text-gray-200" : "text-blue-600"
          }`}
        >
          Prediction results
        </h2>

        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2">
          {visibleTabModels.map((modelName) => (
            <button
              key={modelName}
              className={`px-3 sm:px-4 py-2 rounded text-sm sm:text-base cursor-pointer ${
                activeTab === modelName
                  ? "bg-blue-600 text-white"
                  : isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
              onClick={() => {
                setActiveTab(modelName);
                setCurrentPage(1);
              }}
            >
              {TAB_LABELS[modelName] || `${modelName} Results`}
            </button>
          ))}
        </div>

        <div className={`rounded-lg shadow p-4 sm:p-6 ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white"}`}>
          {paginatedResults.length === 0 ? (
            <p className="text-center py-4 text-sm sm:text-base">
              No results available for {activeTab}. Try running a new prediction{" "}
              <Link to="/new-prediction" className="text-blue-600 hover:underline">
                here
              </Link>.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table
                  className={`min-w-full text-left ${
                    isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white"
                  }`}
                >
                  <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                    <tr>
                      <th className="p-2 sm:p-3 text-xs sm:text-sm">Date</th>
                      <th className="p-2 sm:p-3 text-xs sm:text-sm">SMILES</th>
                      <th className="p-2 sm:p-3 text-xs sm:text-sm hidden sm:table-cell">CAS</th>
                      <th className="p-2 sm:p-3 text-xs sm:text-sm">Predicted value</th>
                      <th className="p-2 sm:p-3 text-xs sm:text-sm">Efficiency</th>
                      <th className="p-2 sm:p-3 text-xs sm:text-sm hidden md:table-cell">
                        Num. heavy atoms
                      </th>
                      <th className="p-2 sm:p-3 text-xs sm:text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300 dark:divide-gray-600">
                    {paginatedResults.map((result, index) => (
                      <tr key={index}>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">{formatDate(result.date)}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm break-all">
                          {result.smiles || "N/A"}
                        </td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm hidden sm:table-cell">
                          {result.cas || "-"}
                        </td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">
                          {isClassificationModel(result.model || result.model_name)
                            ? `${formatNumber(result.predictedValue * 100)}%`
                            : formatNumber(result.predictedValue)}
                        </td>
                        <td
                          className="p-2 sm:p-3 text-xs sm:text-sm"
                          style={{
                            color: result.efficiency === "Effective" ? "green" : "red",
                          }}
                        >
                          {result.efficiency || "N/A"}
                        </td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm hidden md:table-cell">
                          {result.numHeavyAtoms || result.properties?.num_heavy_atoms || "N/A"}
                        </td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">
                          <button
                            onClick={() => handleViewDetails(result)}
                            className="bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-blue-700 cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`px-3 sm:px-4 py-2 rounded text-sm sm:text-base text-white cursor-pointer ${
                    currentPage === 1
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm sm:text-base">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 sm:px-4 py-2 rounded text-sm sm:text-base text-white cursor-pointer ${
                    currentPage === totalPages
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 sm:mt-6">
          <Link
            to={origin === "dashboard" ? "/dashboard" : "/my-predictions"}
            className="bg-blue-500 text-white px-3 sm:px-4 py-2 sm:py-3 rounded text-sm sm:text-base hover:bg-blue-600 inline-block"
          >
            {origin === "dashboard" ? "Back to dashboard" : "Back to history"}
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ResultPage;