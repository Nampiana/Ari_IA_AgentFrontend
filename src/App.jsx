import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AgentsPage from "./pages/agents/AgentsPage";
import AgentProfileTesterPage from "./pages/agents/agentProfileTesterPage";
import CompagnesPage from "./pages/compagne/CompagnesPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AgentsPage />} />
        <Route path="/campagnes" element={<CompagnesPage />} />
        <Route path="/tester" element={<AgentProfileTesterPage />} />
      </Routes>
    </BrowserRouter>
  );
}