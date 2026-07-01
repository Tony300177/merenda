import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SurveyProvider } from './context/SurveyContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SurveyForm } from './components/SurveyForm';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginPage } from './components/LoginPage';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<SurveyForm />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route 
          path="/admin" 
          element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/admin/login" />} 
        />
      </Routes>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SurveyProvider>
        <AppContent />
      </SurveyProvider>
    </AuthProvider>
  );
}