import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css';
import App from './App.jsx';
import SignInPage from './SignInPage.jsx';
import DashboardPage from './DashboardPage.jsx';
import ForgotPasswordPage from './ForgotPasswordPage.jsx';
import SignUpPage from './SignUpPage.jsx';
import LandingPage from './LandingPage.jsx';
import InfoPage from './InfoPage.jsx';
import HistoryPage from './HistoryPage.jsx';
import NewPredictionPage from './NewPredictionPage.jsx';
import ResultsPage from './ResultsPage.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { AuthProvider } from './contexts/AuthContext'; 
import ProtectedRoute from './components/ProtectedRoute'; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/about" element={<InfoPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
