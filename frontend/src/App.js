import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./context/authContext";

// Pages
import LoginPage from "./pages/login-page";
import MainPage from "./pages/mainmanagerdashboard";
import EmployeeDashboard from "./pages/employee-dashboard";
import EmployeeMangement from "./pages/employeemangement";
import TaskManagement from "./pages/taskmangement";
import CommercialRegisterForm from "./pages/commercial-register-form";
import ElectronicBillForm from "./pages/electronic-bill-form";
import PublicTaxForm from "./pages/public-tax-form";
import VATForm from "./pages/vat-form";
import Header from "./components/header";
import OtherForm from "./pages/other-form";

// Protected Route Components
const ProtectedLoginRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to={user.role === 1 ? "/dashboard" : "/employee-dashboard"} replace />;
  }

  return children;
};

const ProtectedRoute = ({ children, role, redirectTo }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={redirectTo || (user.role === 1 ? "/dashboard" : "/employee-dashboard")} replace />;
  }

  return children;
};

function App() {
  const { user, logout } = useAuth();

  return (
    <Router>
      {user && <Header onLogout={logout} />}
      <Routes>
        {/* Login Route - Protected from authenticated users */}
        <Route
          path="/login"
          element={
            <ProtectedLoginRoute>
              <LoginPage />
            </ProtectedLoginRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role={1} redirectTo="/employee-dashboard">
              <MainPage />
            </ProtectedRoute>
          }
        />

        {/* Employee Routes */}
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute role={2} redirectTo="/dashboard">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Shared Protected Routes */}
        <Route
          path="/employee-management"
          element={
            <ProtectedRoute>
              <EmployeeMangement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/task-management"
          element={
            <ProtectedRoute>
              <TaskManagement />
            </ProtectedRoute>
          }
        />

        {/* Form Routes */}
        <Route
          path="/commercial-register"
          element={
            <ProtectedRoute>
              <CommercialRegisterForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/electronic-bill"
          element={
            <ProtectedRoute>
              <ElectronicBillForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/public-tax"
          element={
            <ProtectedRoute>
              <PublicTaxForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vat"
          element={
            <ProtectedRoute>
              <VATForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/other-form"
          element={
            <ProtectedRoute>
              <OtherForm />
            </ProtectedRoute>
          }
        />


        {/* Default Route - Redirects based on authentication and role */}
        <Route
          path="/"
          element={
            user ? (
              user.role === 1 ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/employee-dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all Route - Redirects unknown paths */}
        <Route
          path="*"
          element={
            user ? (
              user.role === 1 ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/employee-dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;