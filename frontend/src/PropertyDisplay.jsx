import React, { useState, useEffect } from "react";

const PropertyDisplay = ({ data, isDarkMode }) => {
  const [showPopup, setShowPopup] = useState(false);

  // Fallback to local storage if isDarkMode prop is not provided
  const [localDarkMode, setLocalDarkMode] = useState(() =>
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    const handleThemeChange = (e) => {
      setLocalDarkMode(e.detail.isDark);
    };
    window.addEventListener("themeChanged", handleThemeChange);
    return () => window.removeEventListener("themeChanged", handleThemeChange);
  }, []);

  // Use prop if provided, otherwise fallback to local state
  const effectiveDarkMode = isDarkMode !== undefined ? isDarkMode : localDarkMode;

  const formatNumber = (num, decimals) => {
    if (num == null || isNaN(num)) return "N/A";
    return Number(num).toFixed(decimals);
  };

  const reference = `Wildman, S.A. and Crippen, G.M. (1999) Prediction of Physicochemical Parameters by Atomic Contribution. Journal of Chemical Information and Computer Sciences, 39, 868-873. http://dx.doi.org/10.1021/ci990307l`;

  const handleShowReference = () => {
    setShowPopup(true);
  };

  const handleClosePopup = (e) => {
    if (e.target === e.currentTarget) {
      setShowPopup(false);
    }
  };

  return (
    <div className="relative">
      <div
        className={`flex items-center border rounded p-2 sm:p-3 ${
          effectiveDarkMode
            ? "border-gray-600 bg-gray-700 text-gray-200"
            : "border-blue-600 bg-white text-gray-800"
        }`}
      >
        <span className="font-semibold mr-2 text-xs sm:text-sm">
          Log P<sub>ow</sub> (Crippen):
        </span>
        <span className="mr-2 text-xs sm:text-sm">{formatNumber(data.properties.logp_crippen, 2)}</span>
        <span
          onClick={handleShowReference}
          className="text-red-600 hover:text-red-800 cursor-pointer ml-2 font-bold"
          aria-label="Show reference"
          title="Click to show reference"
        >
          ?
        </span>
      </div>

      {showPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleClosePopup}
        >
          <div
            className={`p-4 sm:p-6 rounded-lg shadow-md max-w-[90vw] sm:max-w-md w-full ${
              effectiveDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-800"
            }`}
          >
            <p className="whitespace-pre-wrap break-words text-xs sm:text-sm">{reference}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDisplay;