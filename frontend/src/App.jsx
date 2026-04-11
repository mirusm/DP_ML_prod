import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignInPage from "./SignInPage";
import SignUpPage from "./SignUpPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import DashboardPage from "./DashboardPage";
import NewPredictionPage from "./NewPredictionPage";
import NewPredictionAkrPage from "./NewPredictionAkrPage";
import HistoryPage from "./HistoryPage";
import ResultsPage from "./ResultsPage";
import { AuthProvider } from './contexts/AuthContext'; 
import ProtectedRoute from './components/ProtectedRoute'; 

const App = () => {
  return (
    <AuthProvider> 
      <Router>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-prediction"
            element={
              <ProtectedRoute>
                <NewPredictionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-prediction-akrc"
            element={
              <ProtectedRoute>
                <NewPredictionAkrPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-predictions"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/sign-in" />} />
          <Route path="*" element={<Navigate to="/sign-in" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
