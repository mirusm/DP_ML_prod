import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-2 sm:p-4 font-nunito">
      <main className="bg-white p-4 sm:p-6 md:p-8 lg:p-12 rounded-2xl shadow-xl max-w-2xl w-full text-center border-4 border-dashed border-blue-800 overflow-hidden">
        <div className="mb-4 sm:mb-6 mx-auto w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 text-gray-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            fill="currentColor"
            aria-label="Illustration of a mouse with cheese, indicating a 404 error"
          >
            <path d="M50 95c-15 0-27-12-27-27 0-8 4-15 10-20l-3-30c0-3 2-5 5-5h30c3 0 5 2 5 5l-3 30c6 5 10 12 10 20 0 15-12 27-27 27z" />
            <circle cx="30" cy="25" r="10" fill="#f3cde0" />
            <circle cx="70" cy="25" r="10" fill="#f3cde0" />
            <circle cx="45" cy="45" r="3" fill="black" />
            <circle cx="55" cy="45" r="3" fill="black" />
            <path d="M50 55 C 45 60, 55 60, 50 55 Z" fill="#f08080" />
            <path d="M40 15 h20 c5 0 5 5 0 5 h-20 c-5 0 -5-5 0-5z" fill="#a0522d" />
            <path d="M45 5 h10 l5 10 h-20z" fill="#a0522d" />
            <circle cx="75" cy="70" r="10" fill="none" stroke="#808080" strokeWidth="3" />
            <line x1="82" y1="77" x2="90" y2="85" stroke="#a0522d" strokeWidth="4" strokeLinecap="round" />
            <path d="M40 40 Q 45 35 50 40" fill="none" stroke="black" strokeWidth="1.5" />
          </svg>
        </div>

        {/* 404 Header with Cheese Emojis */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-yellow-500 font-chewy relative inline-block">
          4
          <span
            className="absolute top-0 -right-5 sm:-right-6 md:-right-7 text-yellow-400 text-lg sm:text-xl md:text-2xl transform rotate-12 animate-cheese-bounce"
            style={{ '--tw-rotate': '12deg' }}
          >
            🧀
          </span>
          0
          <span
            className="absolute bottom-0 -left-5 sm:-left-6 md:-left-7 text-yellow-400 text-base sm:text-lg md:text-xl transform -rotate-15 animate-cheese-bounce"
            style={{ '--tw-rotate': '-15deg' }}
          >
            🧀
          </span>
          4
        </h1>

        {/* Subtitle */}
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mt-3 sm:mt-4 mb-2 sm:mb-3">
          QSAR Model Consumed! (Error 404)
        </h2>

        {/* Description */}
        <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8 px-2 sm:px-4">
          <b>Squeak!</b> It seems our model's descriptors were just too appetizing. We regret to inform you that the QSAR model needed for this page has been eaten. <br /><br />
          We're currently trying to regenerate the correlations from... well, let's just say the evidence is circumstantial and requires cage cleaning. The page cannot be displayed.
        </p>

        {/* Button */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:-translate-y-0.5 text-sm sm:text-base"
          >
            Back to the Pantry (Homepage)
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;