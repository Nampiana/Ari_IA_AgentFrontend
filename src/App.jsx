import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AgentsPage from "./pages/agents/agentsPage.jsx";
import AgentProfileTesterPage from "./pages/agents/agentProfileTesterPage.jsx";
import CompagnesPage from "./pages/compagne/CompagnesPage.jsx";
import ListsPage from "./pages/lists/listsPage.jsx";
import ToastMessage from "./components/alert/toastMessage.js";

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
    setToast({ ...toast, show: false });
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
        <Routes>
          <Route path="/" element={<AgentsPage showToast={showToast} />} />
          <Route path="/campagnes" element={<CompagnesPage showToast={showToast} />} />
          <Route path="/lists" element={<ListsPage showToast={showToast} />} />
          <Route path="/tester" element={<AgentProfileTesterPage showToast={showToast} />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
