import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

const InfoPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleThemeChange = (e) => {
      setIsDarkMode(e.detail.isDark);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

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
              <span className={`${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>About Project</span>
            </li>
          </ol>
        </nav>
        <header className="flex justify-between items-center mb-6">
          <h1
            className={`text-xl sm:text-2xl font-bold ${
              isDarkMode ? "text-gray-200" : "text-gray-800"
            }`}
          >
            About Project
          </h1>
        </header>

        <div
          className={`rounded-lg shadow p-4 sm:p-6 ${
            isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white"
          }`}
        >
          <h2
            className={`text-lg sm:text-2xl font-bold mb-4 ${
              isDarkMode ? "text-gray-200" : "text-gray-800"
            }`}
          >
            Our project: ML-powered QSAR web tool for predicting ALR1/ALR2 inhibitor efficacy
          </h2>
          <div className="text-sm sm:text-lg leading-relaxed space-y-4">
            <p>
              Modern lifestyle, including lack of physical activity, stress, and exposure to harmful
              substances, significantly contributes to the increasing prevalence of diabetes. This
              serious disease affects more than 422 million people worldwide, with advanced-stage
              diabetes leading to severe complications such as kidney failure, nerve damage, and
              cardiovascular diseases. The development of new drugs represents a complex, financially
              demanding, and time-consuming process that requires extensive testing of active
              compounds.
            </p>
            <p>
              The AKR1B1 enzyme plays a crucial role in the development of these late diabetic
              complications, making its inhibition a promising target in drug development. This
              project focuses on predicting the efficacy of chemical compounds against this enzyme
              using Quantitative Structure-Activity Relationship (QSAR) methods combined with machine
              learning approaches. Based on our custom-built dataset containing chemical structures
              and their inhibitory values, we implemented and evaluated multiple machine learning
              models, identifying the most effective one for this type of prediction.
            </p>
            <p>
              The outcome of our work is a web application that enables researchers to predict the
              efficacy of a given compound along with a comprehensive analysis of its chemical
              properties, visualization of results, and a detailed explanation of the prediction
              based on the amount of different molecular characteristics called chemical descriptors.
              This application has good potential to significantly accelerate and optimize the
              development of new drugs for diabetic complications, reduce research costs, and also
              minimize the need for animal and human testing.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InfoPage;