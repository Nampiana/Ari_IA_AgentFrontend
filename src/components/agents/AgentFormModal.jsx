import React, { useState } from "react";
import "../../assets/css/AgentFormModal.css";

const getInitialFormData = (selectedAgent) => ({
  nomAgent: selectedAgent?.nomAgent || "Aroniaina",
  voice: selectedAgent?.voice || "cedar",
  genderStyle: selectedAgent?.genderStyle || "féminine",
  // companyName: selectedAgent?.companyName || "",
  // objective: selectedAgent?.objective || "",
  // openingScript: selectedAgent?.openingScript || "",
  // quickQuestion: selectedAgent?.quickQuestion || "",
  speed: selectedAgent?.speed || 1,
  // calledNumbers:
  //   selectedAgent?.calledNumbers?.join(", ") ||
  //   "33256564987497, 33256564987498",
  active: selectedAgent?.active || 1,
  // isDefault: selectedAgent?.isDefault ?? 0,
  companyName: selectedAgent?.companyName || "",
});

const getInitials = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "IA";

export default function AgentFormModal({
  open,
  onClose,
  onSubmit,
  selectedAgent,
  showToast,
}) {
  const [formData, setFormData] = useState(() =>
    getInitialFormData(selectedAgent),
  );

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

  const handleSubmit = () => {
    try {
      const payload = {
        ...formData,
      };

      onSubmit(payload);
    } catch (error) {
      console.error("Erreur enregistrement agent :", error);
    }
  };

  return (
    <div className="agentFormOverlay" onClick={onClose}>
      <div className="agentFormModal" onClick={(e) => e.stopPropagation()}>
        <header className="agentFormModal__header">
          <div className="agentFormModal__headerLeft">
            <span className="agentFormModal__badge">
              <i className="bi bi-soundwave" />
            </span>
            <div>
              <h2>{selectedAgent ? "Modifier l'agent" : "Créer un agent"}</h2>
              <p>{formData.nomAgent || "Configurez une nouvelle voix IA"}</p>
            </div>
          </div>
          <button
            type="button"
            className="agentFormModal__close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <form
          className="agentFormModal__form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="agentFormModal__body">
            <div className="agentFormModal__content">
              <div className="agentFormGrid">
                <div className="agentFormGroup">
                  <label className="agentLabel">Nom de l'agent</label>
                  <input
                    className="agentInput"
                    name="nomAgent"
                    value={formData.nomAgent}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* <div className="agentFormGroup">
                  <label className="agentLabel">Société</label>
                  <input
                    className="agentInput"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div> */}

                <div className="agentFormGroup">
                  <label className="agentLabel">Voix</label>
                  <input
                    className="agentInput agentMono"
                    name="voice"
                    value={formData.voice}
                    onChange={handleChange}
                    placeholder="cedar, alloy..."
                    required
                  />
                  <div className="agentHint">
                    Identifiant de la voix TTS utilisée par l'agent.
                  </div>
                </div>

                <div className="agentFormGroup agentFormGroup--full">
                  <label className="agentLabel">Style de genre</label>
                  <div className="agentSegmented">
                    <button
                      type="button"
                      className={`agentSegmented__option ${formData.genderStyle === "féminine" ? "is-active" : ""}`}
                      onClick={() =>
                        setFormData((p) => ({ ...p, genderStyle: "féminine" }))
                      }
                    >
                      <i className="bi bi-gender-female" /> Féminine
                    </button>
                    <button
                      type="button"
                      className={`agentSegmented__option ${formData.genderStyle === "masculine" ? "is-active" : ""}`}
                      onClick={() =>
                        setFormData((p) => ({ ...p, genderStyle: "masculine" }))
                      }
                    >
                      <i className="bi bi-gender-male" /> Masculine
                    </button>
                  </div>
                </div>

                {/* <div className="agentFormGroup">
                  <label className="agentLabel">Objectif</label>
                  <input className="agentInput" name="objective" value={formData.objective} onChange={handleChange} required />
                </div> */}

                {/* <div className="agentFormGroup">
                  <label className="agentLabel">Question rapide</label>
                  <input className="agentInput" name="quickQuestion" value={formData.quickQuestion} onChange={handleChange} required />
                </div> */}

                <div className="agentFormGroup agentFormGroup--full">
                  <label className="agentLabel">Vitesse d'élocution</label>
                  <div className="agentRange">
                    <input
                      type="range"
                      name="speed"
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={formData.speed}
                      onChange={handleChange}
                      className="agentRange__input"
                      style={{
                        "--agent-range-fill": `${((formData.speed - 0.5) / 1.5) * 100}%`,
                      }}
                    />
                    <span className="agentRange__badge">
                      {Number(formData.speed).toFixed(1)}x
                    </span>
                  </div>
                  <div className="agentRange__labels">
                    <span>0.5x · lent</span>
                    <span>1x · normal</span>
                    <span>2x · rapide</span>
                  </div>
                </div>

                {/* <div className="agentFormGroup agentFormGroup--full">
                  <label className="agentLabel">Numéros appelés</label>
                  <input
                    className="agentInput agentMono"
                    name="calledNumbers"
                    value={formData.calledNumbers}
                    onChange={handleChange}
                    placeholder="33568080149, 133568080149"
                  />
                </div> */}

                <div className="agentFormGroup agentFormGroup--full">
                  <label className="agentSwitch">
                    <input
                      type="checkbox"
                      checked={formData.active === 1}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          active: e.target.checked ? 1 : 0,
                        }))
                      }
                    />
                    <span className="agentSwitch__track">
                      <span className="agentSwitch__thumb" />
                    </span>
                    <span className="agentSwitch__label">
                      Agent actif
                      <span className="agentHint">
                        {" "}
                        — disponible pour vos campagnes
                      </span>
                    </span>
                  </label>
                </div>

                {/* <div className="agentFormGroup agentFormGroup--full">
                  <label className="agentSwitch">
                    <input
                      type="checkbox"
                      checked={formData.isDefault === 1}
                      onChange={(e) => setFormData((p) => ({ ...p, isDefault: e.target.checked ? 1 : 0 }))}
                    />
                    <span className="agentSwitch__track"><span className="agentSwitch__thumb" /></span>
                    <span className="agentSwitch__label">Agent par défaut</span>
                  </label>
                </div> */}
              </div>

              {/* <div className="agentFormGroup agentFormGroup--full" style={{ marginTop: 18 }}>
                <label className="agentLabel">Script d'ouverture</label>
                <textarea
                  className="agentInput"
                  name="openingScript"
                  value={formData.openingScript}
                  onChange={handleChange}
                  rows="4"
                  required
                />
              </div> */}
            </div>

            <aside className="agentFormModal__preview">
              <span className="agentFormModal__previewLabel">
                <i className="bi bi-person-vcard" /> Carte d'identité
              </span>
              <div className="agentPreviewCard">
                <div className="agentPreviewCard__avatar">
                  {getInitials(formData.nomAgent)}
                </div>
                <strong className="agentPreviewCard__name">
                  {formData.nomAgent || "Nom de l'agent"}
                </strong>
                <span className="agentPreviewCard__voice">
                  <i className="bi bi-mic-fill" /> {formData.voice || "voix"} ·{" "}
                  {formData.genderStyle}
                </span>
                <span className="agentPreviewCard__speed">
                  <i className="bi bi-speedometer2" />{" "}
                  {Number(formData.speed).toFixed(1)}x
                </span>
                <span
                  className={`agentPreviewCard__status ${formData.active === 1 ? "is-active" : "is-off"}`}
                >
                  <i
                    className={`bi ${formData.active === 1 ? "bi-check-circle-fill" : "bi-pause-circle-fill"}`}
                  />
                  {formData.active === 1 ? "Actif" : "Inactif"}
                </span>
              </div>
            </aside>
          </div>

          <footer className="agentFormModal__footer">
            <button type="button" className="agentBtnGhost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="agentBtnSubmit">
              {selectedAgent ? "Mettre à jour" : "Créer l'agent"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
