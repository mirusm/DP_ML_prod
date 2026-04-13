import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import PropertyDisplay from "./PropertyDisplay";
import { Menu } from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import { db } from "./firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const ResultPage = () => {
  const CLASSIFICATION_MODELS = ["ALR1", "AKR1C1", "AKR1C2", "AKR1C3"];
  const TAB_MODELS = ["ALR1", "ALR2", "AKR1C1", "AKR1C2", "AKR1C3", "SELECTIVITY"];
  const TAB_LABELS = {
    ALR1: "ALR1 Results",
    ALR2: "ALR2 Results",
    AKR1C1: "AKR1C1 Results",
    AKR1C2: "AKR1C2 Results",
    AKR1C3: "AKR1C3 Results",
    SELECTIVITY: "Selectivity Results",
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
  const { currentUser } = useAuth();
  const [detailSelectivityResult, setDetailSelectivityResult] = useState(null);
  const [isLoadingDetailSelectivity, setIsLoadingDetailSelectivity] = useState(false);
  const [xsmilesResult, setXsmilesResult] = useState(null);
  const [isLoadingXsmiles, setIsLoadingXsmiles] = useState(false);
  const [xsmilesError, setXsmilesError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "/api";

  const SELECTIVITY_THRESHOLD = 0.3;
  const INHIBITION_THRESHOLD = 0.65;
  const OFF_TARGET_THRESHOLD = 0.35;
  const NON_INHIBITOR_THRESHOLD = 0.6;
  const PAN_INHIBITOR_MIN = 0.6;
  const SELECTIVITY_CLASS_THRESHOLD = 0.3;

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
      return availableModels.filter((model) => model.startsWith("AKR") || model === "SELECTIVITY");
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
  const isSelectivityTab = activeTab === "SELECTIVITY";
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

  const getPredictionColorClass = (model, value, efficiency) => {
    const normalizedModel = (model || "").toUpperCase();
    const normalizedEfficiency = (efficiency || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[_\s-]+/g, " ");

    // For AKR models, use the categorical efficiency label color mapping.
    if (normalizedModel.startsWith("AKR1C")) {
      if (normalizedEfficiency === "high confidence inhibitor") return "bg-green-500";
      if (normalizedEfficiency === "likely inhibitor") return "bg-yellow-500";
      if (normalizedEfficiency === "uncertain") return "bg-orange-500";
      if (normalizedEfficiency === "likely non inhibitor") return "bg-red-500";
    }

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

  const getEfficiencyColorClass = (efficiency) => {
    const label = (efficiency || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[_\s-]+/g, " ");
    if (label === "highly effective") return "text-green-600";
    if (label === "less effective") return "text-yellow-500";
    if (label === "uncertain") return "text-orange-500";
    if (label === "non effective") return "text-red-600";
    if (label === "high confidence inhibitor") return "text-green-600";
    if (label === "likely inhibitor") return "text-yellow-500";
    if (label === "likely non inhibitor") return "text-red-600";
    if (label === "effective") return "text-green-600";
    if (label === "not effective") return "text-red-600";
    return isDarkMode ? "text-gray-200" : "text-gray-900";
  };

  const getEfficiencyColorStyle = (efficiency) => {
    const label = (efficiency || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[_\s-]+/g, " ");
    if (label === "highly effective") return "#16a34a";
    if (label === "less effective") return "#eab308";
    if (label === "uncertain") return "#f97316";
    if (label === "non effective") return "#dc2626";
    if (label === "high confidence inhibitor") return "#16a34a";
    if (label === "likely inhibitor") return "#eab308";
    if (label === "likely non inhibitor") return "#dc2626";
    if (label === "effective") return "green";
    if (label === "not effective") return "red";
    return isDarkMode ? "#e5e7eb" : "#111827";
  };

  const getSelectivityLabelClass = (label) => {
    const normalized = (label || "").toLowerCase();
    if (normalized === "highly selective") {
      return isDarkMode ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800";
    }
    if (normalized === "moderately selective") {
      return isDarkMode ? "bg-yellow-900 text-yellow-200" : "bg-yellow-100 text-yellow-800";
    }
    if (normalized === "weakly selective") {
      return isDarkMode ? "bg-orange-900 text-orange-200" : "bg-orange-100 text-orange-800";
    }
    return isDarkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800";
  };

  const renderSelectivityCard = (result, index, options = {}) => {
    const isDetailMode = options.isDetailMode === true;
    const payload = result?.selectivity || {
      info: result?.info || {},
      enzymes: result?.enzymes || [],
    };
    const info = payload.info || {};
    const rows = payload.enzymes || [];
    const targetName = info.top_selective_target || "N/A";
    const strongestOffTargetFromRows =
      rows
        .filter((row) => row.enzyme !== targetName)
        .sort((a, b) => (b.inhibition_probability || 0) - (a.inhibition_probability || 0))[0]
        ?.enzyme || "N/A";
    const strongestOffTarget = info.strongest_off_target || strongestOffTargetFromRows;

    const targetProb =
      rows.find((row) => row.enzyme === targetName)?.inhibition_probability || 0;
    const offTargetProb =
      rows
        .filter((row) => row.enzyme !== targetName)
        .reduce((max, row) => Math.max(max, row.inhibition_probability || 0), 0);
    const computedRatio = offTargetProb > 0 ? targetProb / offTargetProb : 0;
    const selectivityRatio = Number(
      info.selectivity_ratio !== undefined && info.selectivity_ratio !== null
        ? info.selectivity_ratio
        : computedRatio
    );
    const ratioTooltip =
      "Ratio = Top-target probability / strongest off-target probability.\n" +
      "~1.0: balanced contest, likely non-selective.\n" +
      "~2.0: weak selectivity.\n" +
      "~5.0: solid selectivity window.\n" +
      ">=10.0: highly specific profile.";

    return (
      <div
        key={`${result?.smiles || "compound"}-${index}`}
        className={`rounded-lg border ${
          isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"
        } ${isDetailMode ? "overflow-hidden" : "p-4 sm:p-6"}`}
      >
        {isDetailMode && (
          <div className="bg-blue-600 text-white p-3">
            <h3 className="font-bold text-sm sm:text-base">Selectivity analysis</h3>
          </div>
        )}

        <div className={`${isDetailMode ? "p-4 sm:p-6" : ""} space-y-6`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {!isDetailMode && (
                <p className={`text-xs sm:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Compound #{startIndex + index + 1}
                </p>
              )}
              <p className="text-sm sm:text-base break-all">
                <span className="font-semibold">SMILES:</span> {result?.smiles || "N/A"}
              </p>
              <p className="text-sm sm:text-base">
                <span className="font-semibold">CAS:</span> {result?.cas || "N/A"}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs sm:text-sm font-semibold ${getSelectivityLabelClass(
                info.selectivity_label
              )}`}
            >
              {info.selectivity_label || "non-selective"}
            </span>
          </div>

          {isDetailMode ? (
            <div className={`rounded-lg border overflow-hidden ${isDarkMode ? "border-gray-700" : "border-blue-100"}`}>
              <div className="bg-blue-600 text-white p-3">
                <h4 className="font-bold text-sm sm:text-base">Main verdict</h4>
              </div>
              <div className={`p-4 sm:p-5 ${isDarkMode ? "bg-gray-800" : "bg-blue-50"}`}>
                <h3 className={`text-lg sm:text-xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                  {info.verdict || "Selectivity result unavailable"}
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className={`text-sm sm:text-base ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Selectivity probability: <strong>{formatNumber((info.confidence_score || 0) * 100)}%</strong>
                  </span>
                  <span className={`text-sm sm:text-base ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Top target: <strong>{info.top_selective_target || "N/A"}</strong>
                  </span>
                  <span className={`text-sm sm:text-base ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Selectivity ratio: <strong>{formatNumber(selectivityRatio)}</strong> ({targetName} vs {strongestOffTarget})
                    <span
                      className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs cursor-help"
                      title={ratioTooltip}
                      aria-label="Selectivity ratio explanation"
                    >
                      i
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-lg border p-4 sm:p-5 ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-blue-100 bg-blue-50"
              }`}
            >
              <p className="text-xs sm:text-sm uppercase tracking-wide text-blue-500 mb-2">Main verdict</p>
              <h3 className={`text-lg sm:text-xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                {info.verdict || "Selectivity result unavailable"}
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className={`text-sm sm:text-base ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Selectivity probability: <strong>{formatNumber((info.confidence_score || 0) * 100)}%</strong>
                </span>
                <span className={`text-sm sm:text-base ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Top target: <strong>{info.top_selective_target || "N/A"}</strong>
                </span>
                <span className={`text-sm sm:text-base ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Selectivity ratio: <strong>{formatNumber(selectivityRatio)}</strong> ({targetName} vs {strongestOffTarget})
                  <span
                    className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs cursor-help"
                    title={ratioTooltip}
                    aria-label="Selectivity ratio explanation"
                  >
                    i
                  </span>
                </span>
              </div>
            </div>
          )}

          <div className={`rounded-lg border ${isDetailMode ? "overflow-hidden" : "p-4 sm:p-5"} ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            {isDetailMode ? (
              <>
                <div className="bg-blue-600 text-white p-3">
                  <h4 className="font-bold text-sm sm:text-base">Inhibition vs Selectivity</h4>
                </div>
                <div className={`p-4 sm:p-5 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                  <div className="space-y-4">
                    {rows.map((row) => {
                      const inhibitionPercent = Math.max(0, Math.min(100, (row.inhibition_probability || 0) * 100));
                      const selectivityPercent = Math.max(0, Math.min(100, (row.selectivity_probability || 0) * 100));
                      return (
                        <div key={row.enzyme} className="space-y-2">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="font-semibold">{row.enzyme}</span>
                            <span>
                              Inhibition {formatNumber(inhibitionPercent)}% | Selectivity {formatNumber(selectivityPercent)}%
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <div className={`w-full h-3 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                                <div className="h-3 rounded-full bg-blue-500" style={{ width: `${inhibitionPercent}%` }} />
                              </div>
                              <p className="text-[11px] mt-1 text-blue-500">Inhibition (p)</p>
                            </div>
                            <div>
                              <div className={`w-full h-3 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                                <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${selectivityPercent}%` }} />
                              </div>
                              <p className="text-[11px] mt-1 text-emerald-500">Selectivity (sel_prob)</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                <h4 className={`font-bold mb-4 text-sm sm:text-base ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                  Inhibition vs Selectivity
                </h4>
                <div className="space-y-4">
                  {rows.map((row) => {
                    const inhibitionPercent = Math.max(0, Math.min(100, (row.inhibition_probability || 0) * 100));
                    const selectivityPercent = Math.max(0, Math.min(100, (row.selectivity_probability || 0) * 100));
                    return (
                      <div key={row.enzyme} className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="font-semibold">{row.enzyme}</span>
                          <span>
                            Inhibition {formatNumber(inhibitionPercent)}% | Selectivity {formatNumber(selectivityPercent)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <div className={`w-full h-3 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                              <div className="h-3 rounded-full bg-blue-500" style={{ width: `${inhibitionPercent}%` }} />
                            </div>
                            <p className="text-[11px] mt-1 text-blue-500">Inhibition (p)</p>
                          </div>
                          <div>
                            <div className={`w-full h-3 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                              <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${selectivityPercent}%` }} />
                            </div>
                            <p className="text-[11px] mt-1 text-emerald-500">Selectivity (sel_prob)</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {isDetailMode ? (
            <div className={`rounded-lg border overflow-hidden ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="bg-blue-600 text-white p-3">
                <h4 className="font-bold text-sm sm:text-base">Per-enzyme probabilities</h4>
              </div>
              <div className={`p-4 sm:p-5 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rows.map((row) => (
                    <div
                      key={`${row.enzyme}-card`}
                      className={`rounded-lg border p-4 ${isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}
                    >
                      <h5 className="font-bold mb-2">{row.enzyme}</h5>
                      <p className="text-sm">Inhibition probability: {formatNumber((row.inhibition_probability || 0) * 100)}%</p>
                      <p className="text-sm">Selectivity probability: {formatNumber((row.selectivity_probability || 0) * 100)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rows.map((row) => (
                <div
                  key={`${row.enzyme}-card`}
                  className={`rounded-lg border p-4 ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
                >
                  <h5 className="font-bold mb-2">{row.enzyme}</h5>
                  <p className="text-sm">Inhibition probability: {formatNumber((row.inhibition_probability || 0) * 100)}%</p>
                  <p className="text-sm">Selectivity probability: {formatNumber((row.selectivity_probability || 0) * 100)}%</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const xsmilesScoreTooltip =
    "Score interpretation: values above 0 support inhibition, values below 0 oppose inhibition. " +
    "The larger the absolute score, the stronger the influence. Scores close to 0 indicate a weak or unclear effect.";

  const buildSelectivityFromAkrRows = (rows, smiles, cas, iupacName) => {
    const pMap = {
      AKR1C1: Number(rows.find((r) => (r.model_name || "").toUpperCase() === "AKR1C1")?.prediction || 0),
      AKR1C2: Number(rows.find((r) => (r.model_name || "").toUpperCase() === "AKR1C2")?.prediction || 0),
      AKR1C3: Number(rows.find((r) => (r.model_name || "").toUpperCase() === "AKR1C3")?.prediction || 0),
    };

    const p1 = pMap.AKR1C1;
    const p2 = pMap.AKR1C2;
    const p3 = pMap.AKR1C3;

    const selMap = {
      AKR1C1: p1 * (1 - p2) * (1 - p3),
      AKR1C2: p2 * (1 - p1) * (1 - p3),
      AKR1C3: p3 * (1 - p1) * (1 - p2),
    };

    const topTarget = Object.keys(selMap).reduce((best, key) =>
      selMap[key] > selMap[best] ? key : best
    , "AKR1C1");
    const topProb = selMap[topTarget];
    const nonInhibitorProb = (1 - p1) * (1 - p2) * (1 - p3);
    const panInhibitorProb = p1 * p2 * p3;

    let compoundClass = "uncertain";
    if (nonInhibitorProb > NON_INHIBITOR_THRESHOLD) {
      compoundClass = "non-inhibitor";
    } else if (Math.min(p1, p2, p3) > PAN_INHIBITOR_MIN) {
      compoundClass = "pan-inhibitor";
    } else if (topProb > SELECTIVITY_CLASS_THRESHOLD && pMap[topTarget] > INHIBITION_THRESHOLD) {
      compoundClass = `selective_${topTarget}`;
    }

    const offTargets = ["AKR1C1", "AKR1C2", "AKR1C3"].filter((x) => x !== topTarget);
    const strongestOffTarget = offTargets.reduce((best, key) =>
      pMap[key] > pMap[best] ? key : best
    , offTargets[0]);
    const maxOff = Math.max(pMap[offTargets[0]], pMap[offTargets[1]]);
    const ratio = pMap[topTarget] / (maxOff + 1e-6);

    let selectivityLabel = "non-selective";
    if (ratio > 5 && pMap[topTarget] > 0.75 && maxOff < 0.25) {
      selectivityLabel = "highly selective";
    } else if (ratio > 3 && pMap[topTarget] > INHIBITION_THRESHOLD && maxOff < OFF_TARGET_THRESHOLD) {
      selectivityLabel = "moderately selective";
    } else if (ratio > 1.5 && pMap[topTarget] > 0.5) {
      selectivityLabel = "weakly selective";
    }

    const verdict =
      selectivityLabel !== "non-selective"
        ? `This compound is selective for ${topTarget}`
        : "This compound is non-selective across AKR1C enzymes";

    return {
      smiles,
      cas,
      model_name: "SELECTIVITY",
      info: {
        iupac_name: iupacName || "N/A",
        verdict,
        confidence_score: Number(topProb.toFixed(5)),
        selectivity_label: selectivityLabel,
        compound_class: compoundClass,
        top_selective_target: topTarget,
        strongest_off_target: strongestOffTarget,
        top_selective_probability: Number(topProb.toFixed(5)),
        multi_target_prob_all_3: Number(panInhibitorProb.toFixed(5)),
        non_inhibitor_prob: Number(nonInhibitorProb.toFixed(5)),
        selectivity_ratio: Number(ratio.toFixed(5)),
      },
      selectivity: {
        info: {
          iupac_name: iupacName || "N/A",
          verdict,
          confidence_score: Number(topProb.toFixed(5)),
          selectivity_label: selectivityLabel,
          compound_class: compoundClass,
          top_selective_target: topTarget,
          strongest_off_target: strongestOffTarget,
          top_selective_probability: Number(topProb.toFixed(5)),
          multi_target_prob_all_3: Number(panInhibitorProb.toFixed(5)),
          non_inhibitor_prob: Number(nonInhibitorProb.toFixed(5)),
          selectivity_ratio: Number(ratio.toFixed(5)),
        },
        enzymes: [
          { enzyme: "AKR1C1", inhibition_probability: Number(p1.toFixed(5)), selectivity_probability: Number(selMap.AKR1C1.toFixed(5)) },
          { enzyme: "AKR1C2", inhibition_probability: Number(p2.toFixed(5)), selectivity_probability: Number(selMap.AKR1C2.toFixed(5)) },
          { enzyme: "AKR1C3", inhibition_probability: Number(p3.toFixed(5)), selectivity_probability: Number(selMap.AKR1C3.toFixed(5)) },
        ],
      },
    };
  };

  useEffect(() => {
    const loadDetailSelectivity = async () => {
      if (!selectedResult) {
        setDetailSelectivityResult(null);
        return;
      }

      const modelName = (selectedResult.model_name || selectedResult.model || "").toUpperCase();
      if (!modelName.startsWith("AKR1C")) {
        setDetailSelectivityResult(null);
        return;
      }

      if (selectedResult.selectivity) {
        setDetailSelectivityResult(selectedResult);
        return;
      }

      if (!currentUser) {
        setDetailSelectivityResult(null);
        return;
      }

      setIsLoadingDetailSelectivity(true);
      try {
        const predictionsRef = collection(db, `users/${currentUser.uid}/predictions`);
        let docs = [];

        if (selectedResult.run_id) {
          const runQuery = query(predictionsRef, where("run_id", "==", selectedResult.run_id));
          const runSnap = await getDocs(runQuery);
          docs = runSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }

        if (docs.length === 0 && selectedResult.smiles) {
          const smilesQuery = query(predictionsRef, where("smiles", "==", selectedResult.smiles));
          const smilesSnap = await getDocs(smilesQuery);
          docs = smilesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

          if (selectedResult.cas) {
            docs = docs.filter((d) => (d.cas || "") === selectedResult.cas);
          }
        }

        const akrDocs = docs.filter((d) => ["AKR1C1", "AKR1C2", "AKR1C3"].includes((d.model_name || "").toUpperCase()));
        const latestByModel = {};
        akrDocs
          .sort((a, b) => {
            const ad = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
            const bd = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
            return bd - ad;
          })
          .forEach((row) => {
            const key = (row.model_name || "").toUpperCase();
            if (!latestByModel[key]) {
              latestByModel[key] = row;
            }
          });

        const trio = [latestByModel.AKR1C1, latestByModel.AKR1C2, latestByModel.AKR1C3].filter(Boolean);
        if (trio.length === 3) {
          const computed = buildSelectivityFromAkrRows(
            trio,
            selectedResult.smiles,
            selectedResult.cas,
            selectedResult.info?.iupac_name
          );
          setDetailSelectivityResult(computed);
        } else {
          setDetailSelectivityResult(null);
        }
      } catch {
        setDetailSelectivityResult(null);
      } finally {
        setIsLoadingDetailSelectivity(false);
      }
    };

    loadDetailSelectivity();
  }, [selectedResult, currentUser]);

  useEffect(() => {
    const loadXsmilesDetail = async () => {
      if (!selectedResult) {
        setXsmilesResult(null);
        setXsmilesError("");
        return;
      }

      const modelName = (selectedResult.model_name || selectedResult.model || "").toUpperCase();
      if (!modelName.startsWith("AKR1C")) {
        setXsmilesResult(null);
        setXsmilesError("");
        return;
      }

      if (!selectedResult.smiles) {
        setXsmilesResult(null);
        setXsmilesError("SMILES not available for XSMILES perturbation analysis.");
        return;
      }

      setIsLoadingXsmiles(true);
      setXsmilesError("");

      try {
        const response = await fetch(`${API_URL}/akrc-xsmiles/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(currentUser?.uid ? { "User-Id": currentUser.uid } : {}),
          },
          body: JSON.stringify({
            smiles: selectedResult.smiles,
            cas: selectedResult.cas || "",
            inputType: "SMILES",
            model_name: modelName,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Failed to compute XSMILES perturbation analysis");
        }
        setXsmilesResult(data);
      } catch (error) {
        setXsmilesResult(null);
        setXsmilesError(error?.message || "Failed to compute XSMILES perturbation analysis");
      } finally {
        setIsLoadingXsmiles(false);
      }
    };

    loadXsmilesDetail();
  }, [selectedResult, currentUser, API_URL]);

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
                        selectedResult.predictedValue || selectedResult.prediction,
                        selectedResult.efficiency
                      )}`}
                    >
                      {isClassificationModel(selectedResult.model || selectedResult.model_name)
                        ? `${formatNumber((selectedResult.predictedValue || selectedResult.prediction || 0) * 100)}%`
                        : formatNumber(selectedResult.predictedValue || selectedResult.prediction || 0)}
                    </div>
                    <p className={`font-semibold text-sm sm:text-base text-center ${getEfficiencyColorClass(selectedResult.efficiency)}`}>
                      {selectedResult.efficiency || "N/A"}
                    </p>
                    <p className={`font-semibold text-sm sm:text-base text-center ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                      {(selectedResult.model || selectedResult.model_name || "").toUpperCase().startsWith("AKR1C")
                        ? "(Predicted probability)"
                        : isClassificationModel(selectedResult.model || selectedResult.model_name)
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

              {(selectedResult.model_name || selectedResult.model || "").toUpperCase().startsWith("AKR1C") && (
                <div className={`rounded-lg shadow overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                  <div className="text-white p-3 bg-blue-600">
                    <h3 className="font-bold">BRICS fragment perturbation (XSMILES)</h3>
                  </div>

                  {isLoadingXsmiles ? (
                    <div className="p-4">
                      <p className="text-sm">Computing perturbation heatmap...</p>
                    </div>
                  ) : xsmilesError ? (
                    <div className="p-4">
                      <p className="text-sm text-red-600">{xsmilesError}</p>
                    </div>
                  ) : xsmilesResult ? (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <p>
                          <span className="font-semibold">Generated perturbations:</span>{" "}
                          {xsmilesResult.perturbations_generated ?? 0}
                        </p>
                      </div>

                      {xsmilesResult.heatmap_png && (
                        <img
                          src={`data:image/png;base64,${xsmilesResult.heatmap_png}`}
                          alt="XSMILES BRICS perturbation heatmap"
                          className="w-full cursor-pointer"
                          onClick={() => handleImageClick(`data:image/png;base64,${xsmilesResult.heatmap_png}`)}
                        />
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className={`rounded border p-3 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            Top positive atoms
                            <span
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] cursor-help"
                              title={xsmilesScoreTooltip}
                              aria-label="Score interpretation help"
                            >
                              i
                            </span>
                          </h4>
                          {(xsmilesResult.top_positive_atoms || []).slice(0, 8).map((row) => (
                            <p key={`pos-${row.atom_idx}`}>
                              Atom {row.atom_idx} ({row.symbol}): {formatNumber(row.score, 4)}
                            </p>
                          ))}
                        </div>
                        <div className={`rounded border p-3 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            Top negative atoms
                            <span
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] cursor-help"
                              title={xsmilesScoreTooltip}
                              aria-label="Score interpretation help"
                            >
                              i
                            </span>
                          </h4>
                          {(xsmilesResult.top_negative_atoms || []).slice(0, 8).map((row) => (
                            <p key={`neg-${row.atom_idx}`}>
                              Atom {row.atom_idx} ({row.symbol}): {formatNumber(row.score, 4)}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <p className="text-sm">No perturbation data available.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {(selectedResult.model_name || selectedResult.model || "").toUpperCase().startsWith("AKR1C") && (
            <div className="mt-6">
              {isLoadingDetailSelectivity ? (
                <div className={`rounded-lg border p-4 ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
                  <p className="text-sm">Loading selectivity analysis...</p>
                </div>
              ) : detailSelectivityResult ? (
                <div>{renderSelectivityCard(detailSelectivityResult, 0, { isDetailMode: true })}</div>
              ) : null}
            </div>
          )}

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
          {isSelectivityTab ? (
            paginatedResults.length === 0 ? (
              <p className="text-center py-4 text-sm sm:text-base">
                No selectivity results available yet. Run AKR prediction with all three enzymes.
              </p>
            ) : (
              <div className="space-y-6">{paginatedResults.map((result, idx) => renderSelectivityCard(result, idx))}</div>
            )
          ) : paginatedResults.length === 0 ? (
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
                          style={{ color: getEfficiencyColorStyle(result.efficiency) }}
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

          {isSelectivityTab && totalPages > 1 && (
            <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`px-3 sm:px-4 py-2 rounded text-sm sm:text-base text-white cursor-pointer ${
                  currentPage === 1 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
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
                  currentPage === totalPages ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Next
              </button>
            </div>
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