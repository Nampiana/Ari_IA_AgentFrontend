import React, { useState, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AgentsPage from "./pages/agents/agentsPage.jsx";
import AgentProfileTesterPage from "./pages/agents/agentProfileTesterPage.jsx";
import CompagnesPage from "./pages/compagne/CompagnesPage.jsx";
import ListsPage from "./pages/lists/listsPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import Historique from "./pages/historique/HistoriquesPage.jsx";

import ToastMessage from "./components/alert/toastMessage.js";
import { AuthProvider, AuthContext } from "./context/AuthContext.jsx";

function PrivateRoute({ children }) {
  const { isLogged } = useContext(AuthContext);

  return isLogged ? children : <Navigate to="/login" replace />;
}

function AppRoutes({ showToast }) {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <AgentsPage showToast={showToast} />
          </PrivateRoute>
        }
      />

      <Route
        path="/campagnes"
        element={
          <PrivateRoute>
            <CompagnesPage showToast={showToast} />
          </PrivateRoute>
        }
      />

      <Route
        path="/lists"
        element={
          <PrivateRoute>
            <ListsPage showToast={showToast} />
          </PrivateRoute>
        }
      />

      <Route
        path="/tester"
        element={
          <PrivateRoute>
            <AgentProfileTesterPage showToast={showToast} />
          </PrivateRoute>
        }
      />

      <Route
        path="/historique"
        element={
          <PrivateRoute>
            <Historique showToast={showToast} />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  return (
    <>
      {toast.show && (
        <ToastMessage
          type={toast.type}
          message={toast.message}
          onClose={hideToast}
        />
      )}

      <BrowserRouter>
        <AuthProvider>
          <AppRoutes showToast={showToast} />
          <ToastContainer />
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}