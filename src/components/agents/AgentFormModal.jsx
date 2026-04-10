import React, { useState } from "react";

const getInitialFormData = (selectedAgent) => ({
  nomAgent: selectedAgent?.nomAgent || "",
  voice: selectedAgent?.voice || "",
  genderStyle: selectedAgent?.genderStyle || "féminine",
  companyName: selectedAgent?.companyName || "",
  objective: selectedAgent?.objective || "",
  openingScript: selectedAgent?.openingScript || "",
  quickQuestion: selectedAgent?.quickQuestion || "",
  speed: selectedAgent?.speed ?? 1,
  calledNumbers: selectedAgent?.calledNumbers?.join(", ") || "",
  active: selectedAgent?.active ?? 1,
  isDefault: selectedAgent?.isDefault ?? 0,
});

export default function AgentFormModal({ open, onClose, onSubmit, selectedAgent }) {
  const [formData, setFormData] = useState(() => getInitialFormData(selectedAgent));

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "speed" || name === "active" || name === "isDefault"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      calledNumbers: formData.calledNumbers
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    onSubmit(payload);
  };

  return (
    <div className="agentModalOverlay" onClick={onClose}>
      <div className="agentModal" onClick={(e) => e.stopPropagation()}>
        <div className="agentModalHeader">
          <h2>{selectedAgent ? "Modifier l’agent" : "Créer un agent"}</h2>
          <button type="button" className="closeBtn" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="agentForm">
          <div className="formGrid">
            <div className="formGroup">
              <label>Nom agent</label>
              <input name="nomAgent" value={formData.nomAgent} onChange={handleChange} required />
            </div>

            <div className="formGroup">
              <label>Voix</label>
              <input name="voice" value={formData.voice} onChange={handleChange} required />
            </div>

            <div className="formGroup">
              <label>Style de genre</label>
              <select name="genderStyle" value={formData.genderStyle} onChange={handleChange}>
                <option value="féminine">féminine</option>
                <option value="masculine">masculine</option>
              </select>
            </div>

            <div className="formGroup">
              <label>Société</label>
              <input name="companyName" value={formData.companyName} onChange={handleChange} required />
            </div>

            <div className="formGroup">
              <label>Objectif</label>
              <input name="objective" value={formData.objective} onChange={handleChange} required />
            </div>

            <div className="formGroup">
              <label>Question rapide</label>
              <input name="quickQuestion" value={formData.quickQuestion} onChange={handleChange} required />
            </div>

            <div className="formGroup">
              <label>Vitesse</label>
              <input type="number" step="0.1" name="speed" value={formData.speed} onChange={handleChange} />
            </div>

            <div className="formGroup">
              <label>Numéros appelés</label>
              <input
                name="calledNumbers"
                value={formData.calledNumbers}
                onChange={handleChange}
                placeholder="33568080149, 133568080149"
              />
            </div>

            <div className="formGroup">
              <label>Actif</label>
              <select name="active" value={formData.active} onChange={handleChange}>
                <option value={1}>Oui</option>
                <option value={0}>Non</option>
              </select>
            </div>

            <div className="formGroup">
              <label>Par défaut</label>
              <select name="isDefault" value={formData.isDefault} onChange={handleChange}>
                <option value={0}>Non</option>
                <option value={1}>Oui</option>
              </select>
            </div>
          </div>

          <div className="formGroup full">
            <label>Script d’ouverture</label>
            <textarea
              name="openingScript"
              value={formData.openingScript}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>

          <div className="agentModalActions">
            <button type="button" className="btnGhost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btnPrimary">
              {selectedAgent ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}