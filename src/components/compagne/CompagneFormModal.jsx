import React, { useEffect, useRef, useState } from "react";

const getInitialFormData = (selectedCompagne) => ({
  nomCompagne: selectedCompagne?.nomCompagne || "",
  numero: selectedCompagne?.numero || "",
  script: selectedCompagne?.script || "",
  id_ia: selectedCompagne?.id_ia?._id || selectedCompagne?.id_ia || "",
  fiches: Array.isArray(selectedCompagne?.fiches)
    ? selectedCompagne.fiches.map((f) => f?._id || f)
    : [],
  active: selectedCompagne?.active ?? 1,
  dialTimeout: selectedCompagne?.dialTimeout ?? 30,
  maxConcurrentCalls: selectedCompagne?.maxConcurrentCalls ?? 1,
});

function FichesMultiSelect({ lists, selectedIds, onToggle }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLists = lists.filter((l) => selectedIds.includes(l._id));

  return (
    <div className="multiSelectWrapper" ref={containerRef}>
      <button
        type="button"
        className="multiSelectTrigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedLists.length === 0 ? (
          <span className="multiSelectPlaceholder">Sélectionner une ou plusieurs fiches</span>
        ) : (
          <div className="multiSelectTags">
            {selectedLists.map((list) => (
              <span key={list._id} className="multiSelectTag">
                {list.nomFiche}
                <i
                  className="bi bi-x"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(list._id);
                  }}
                />
              </span>
            ))}
          </div>
        )}
        <i className={`bi bi-chevron-${open ? "up" : "down"} multiSelectChevron`} />
      </button>

      {open && (
        <div className="multiSelectDropdown">
          {lists.length === 0 ? (
            <div className="formHint multiSelectEmpty">Aucune liste disponible</div>
          ) : (
            lists.map((list) => (
              <label key={list._id} className="multiSelectOption">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(list._id)}
                  onChange={() => onToggle(list._id)}
                />
                <span>{list.nomFiche}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function CompagneFormModal({
  open,
  onClose,
  onSubmit,
  selectedCompagne,
  agents = [],
  lists = [],
}) {
  const [formData, setFormData] = useState(() => getInitialFormData(selectedCompagne));

  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(selectedCompagne));
    }
  }, [open, selectedCompagne]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["active", "dialTimeout", "maxConcurrentCalls"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const toggleFiche = (listId) => {
    setFormData((prev) => {
      const exists = prev.fiches.includes(listId);
      return {
        ...prev,
        fiches: exists
          ? prev.fiches.filter((id) => id !== listId)
          : [...prev.fiches, listId],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, id_ia: formData.id_ia || null });
  };

  return (
    <div className="agentModalOverlay" onClick={onClose}>
      <div className="agentModal" onClick={(e) => e.stopPropagation()}>
        <div className="agentModalHeader">
          <h2>{selectedCompagne ? "Modifier la campagne" : "Créer une campagne"}</h2>
          <button type="button" className="closeBtn" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="agentForm">
          <div className="formGrid">

            <div className="formGroup">
              <label>Nom de la campagne</label>
              <input
                name="nomCompagne"
                value={formData.nomCompagne}
                onChange={handleChange}
                required
              />
            </div>

            <div className="formGroup">
              <label>Numéro</label>
              <input
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                required
              />
            </div>

            <div className="formGroup">
              <label>Agent IA associé</label>
              <select name="id_ia" value={formData.id_ia} onChange={handleChange}>
                <option value="">Sélectionner un agent</option>
                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.nomAgent || agent.companyName || "Agent sans nom"}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label>Statut</label>
              <select name="active" value={formData.active} onChange={handleChange}>
                <option value={1}>Actif</option>
                <option value={0}>Inactif</option>
              </select>
            </div>

            <div className="formGroup">
              <label>
                Timeout d'appel
                <span className="formHint"> (secondes)</span>
              </label>
              <input
                type="number"
                name="dialTimeout"
                min={5}
                max={120}
                value={formData.dialTimeout}
                onChange={handleChange}
              />
            </div>

          </div>

          {/* Sélection multiple des fiches (listes CSV) — dropdown */}
          <div className="formGroup full">
            <label>
              Fiches (listes CSV)
              <span className="formHint"> (plusieurs listes possibles)</span>
            </label>
            <FichesMultiSelect
              lists={lists}
              selectedIds={formData.fiches}
              onToggle={toggleFiche}
            />
            {formData.fiches.length > 0 && (
              <div className="formHint">
                {formData.fiches.length} liste(s) sélectionnée(s)
              </div>
            )}
          </div>

          {/* Slider appels simultanés */}
          <div className="formGroup full">
            <label>
              Appels simultanés
              <span className="formHint"> (agents IA actifs en même temps)</span>
            </label>
            <div className="concurrentWrapper">
              <input
                type="range"
                name="maxConcurrentCalls"
                min={1}
                max={10}
                step={1}
                value={formData.maxConcurrentCalls}
                onChange={handleChange}
                className="formRange"
              />
              <span className="concurrentBadge">{formData.maxConcurrentCalls}</span>
            </div>
            <div className="concurrentLabels">
              <span>1 (séquentiel)</span>
              <span>5</span>
              <span>10 (max)</span>
            </div>
          </div>

          <div className="formGroup full">
            <label>Script</label>
            <textarea
              name="script"
              value={formData.script}
              onChange={handleChange}
              rows="6"
              required
            />
          </div>

          {selectedCompagne?.scriptFinal && (
            <div className="formGroup full">
              <label>Aperçu du script final</label>
              <textarea value={selectedCompagne.scriptFinal} readOnly rows="8" />
            </div>
          )}

          <div className="agentModalActions">
            <button type="button" className="btnGhost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btnPrimary">
              {selectedCompagne ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}