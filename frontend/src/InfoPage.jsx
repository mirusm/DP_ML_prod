import React, { useState } from "react";
import Sidebar from "./Sidebar";

const InfoPage = () => {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />

      <main className="flex-1 p-6 ml-64">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Tooltip</h1>
        </header>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Our project: ML-powered QSAR web tool for predicting ALR1/ALR2 inhibitor efficacy
          </h2>
          <div className="text-gray-700 text-lg space-y-4">
            <p>
              Modern lifestyle, including lack of physical activity, stress, and exposure to harmful substances, significantly contributes to the increasing prevalence of diabetes. This serious disease affects more than 422 million people worldwide, with advanced-stage diabetes leading to severe complications such as kidney failure, nerve damage, and cardiovascular diseases. The development of new drugs represents a complex, financially demanding, and time-consuming process that requires extensive testing of active compounds.
            </p>
            <p>
              The AKR1B1 enzyme plays a crucial role in the development of these late diabetic complications, making its inhibition a promising target in drug development. This project focuses on predicting the efficacy of chemical compounds against this enzyme using Quantitative Structure-Activity Relationship (QSAR) methods combined with machine learning approaches. Based on our custom-built dataset containing chemical structures and their inhibitory values, we implemented and evaluated multiple machine learning models, identifying the most effective one for this type of prediction.
            </p>
            <p>
              The outcome of our work is a web application that enables researchers to predict the efficacy of a given compound along with a comprehensive analysis of its chemical properties, visualization of results, and a detailed explanation of the prediction based on the amount of different molecular characteristics called chemical descriptors. This application has good potential to significantly accelerate and optimize the development of new drugs for diabetic complications, reduce research costs, and also minimize the need for animal and human testing.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InfoPage;