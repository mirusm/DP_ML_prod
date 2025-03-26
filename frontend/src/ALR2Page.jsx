import React, { useState } from "react";

const ALR2Page = () => {
  const [smiles, setSmiles] = useState("");
  const [cas, setCas] = useState("");
  const [model, setModel] = useState("alr1");
  const [inputType, setInputType] = useState("SMILES");

  const [errorMessage, setErrorMessage] = useState("");
  const [results, setResults] = useState(null);

  const handleSubmit = async () => {
    if (!smiles && !cas) {
      setErrorMessage("SMILES or CAS code cannot be empty");
      return;
    }
    setErrorMessage("");
    // Handle submit logic here
    console.log("SMILES:", smiles);
    console.log("CAS:", cas);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/upload/", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smiles,
          cas,
          model,
          inputType
        }),
      });
      const data = await response.json();
      setResults(data);
      console.log("Response:", data);
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("An error occurred while submitting the data.");
    }
  };

  return (
    <div className="bg-white p-10 w-full">
      <h1 className="text-2xl font-bold mb-8 text-gray-800">ALR2 Prediction</h1>

      <div className="flex flex-row items-center">
        <div className="mb-4 w-[200px] mr-10">
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select
            className="w-full p-2 border border-gray-300 rounded text-gray-700"
            value={inputType}
            onChange={(e) => setInputType(e.target.value)}
          >
            <option>SMILES</option>
            <option>CAS</option>
          </select>
        </div>

        <div className="mb-4 w-[500px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">{inputType} code:</label>
          <input
            type="text"
            value={inputType === "SMILES" ? smiles : cas}
            onChange={(e) => inputType === "SMILES" ? setSmiles(e.target.value) : setCas(e.target.value)}
            placeholder={`Enter ${inputType} code`}
            className="mb-4 p-2 border border-gray-300 rounded w-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

        <button
          onClick={handleSubmit}
          className="ml-auto bg-yellow-500 h-[50px] text-white rounded text-lg hover:bg-yellow-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          Run
        </button>
      </div>

      {results && (
        <div>
        <h2 className="text-xl font-bold mb-4 text-gray-800">Results</h2>
        <div className="mt-8 border-solid border-gray-300 border-1 rounded-lg p-5">
          <div className="flex flex-col">
            {results.predicted_value && <p><b>Predicted value: </b>{results.predicted_value}</p>}
            {results.molecule_image && <p><b>Molecole image:</b> <img src={`data:image/png;base64,${results.molecule_image}`} alt="Result" className="mb-4 w-100" /></p>}
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default ALR2Page;