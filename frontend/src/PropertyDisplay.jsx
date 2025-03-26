import React, { useState } from "react";

const PropertyDisplay = ({ data }) => {
  const [showPopup, setShowPopup] = useState(false);

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
      <p className="flex items-center border border-blue-600 rounded p-2 text-gray-800">
        <span className="font-semibold mr-2">Log P<sub>ow</sub> (Crippen):</span>
        <span className="mr-2">{formatNumber(data.properties.logp_crippen, 2)}</span>
        <span
          onClick={handleShowReference}
          className="text-blue-600 hover:text-blue-800 cursor-pointer ml-1"
          aria-label="Show reference"
          title="Click to show reference"
        >
          ?
        </span>
      </p>

      {showPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleClosePopup}
        >
          <div className="bg-white p-4 rounded-lg shadow-md max-w-md w-full text-gray-800">
            <p className="whitespace-pre-wrap break-words">{reference}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDisplay;