import React, { useEffect, useRef, useState } from "react";

const getInitialFormData = (selectedCompagne) => ({
  nomCompagne: selectedCompagne?.nomCompagne || "",
  numero: selectedCompagne?.numero || "",
  script: selectedCompagne?.script || "",
  scriptTranscription: selectedCompagne?.scriptTranscription || "",
  id_ia: selectedCompagne?.id_ia?._id || selectedCompagne?.id_ia || "",
  fiches: Array.isArray(selectedCompagne?.fiches)
    ? selectedCompagne.fiches.map((f) => f?._id || f)
    : [],
  active: selectedCompagne?.active ?? 1,
  dialTimeout: selectedCompagne?.dialTimeout ?? 30,
  maxConcurrentCalls: selectedCompagne?.maxConcurrentCalls ?? 1,
  allowedDays: Array.isArray(selectedCompagne?.allowedDays)
    ? selectedCompagne.allowedDays
    : [1, 2, 3, 4, 5],
  startHour: selectedCompagne?.startHour || "08:00",
  endHour: selectedCompagne?.endHour || "21:00",
  timeZone: selectedCompagne?.timeZone || "Europe/Paris",
  // ✅ Type d'appel : "inbound" = entrant, "outbound" = sortant
  callType: selectedCompagne?.callType || "outbound",
  backgroundNoise: selectedCompagne?.backgroundNoise ?? false,
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
          <span className="multiSelectPlaceholder">
            Sélectionner une ou plusieurs fiches
          </span>
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
        <i
          className={`bi bi-chevron-${open ? "up" : "down"} multiSelectChevron`}
        />
      </button>

      {open && (
        <div className="multiSelectDropdown">
          {lists.length === 0 ? (
            <div className="formHint multiSelectEmpty">
              Aucune liste disponible
            </div>
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
  loadingUpdate = false,
}) {
  const [formData, setFormData] = useState(() =>
    getInitialFormData(selectedCompagne),
  );

  const DAYS = [
    { value: 1, label: "Lundi" },
    { value: 2, label: "Mardi" },
    { value: 3, label: "Mercredi" },
    { value: 4, label: "Jeudi" },
    { value: 5, label: "Vendredi" },
    { value: 6, label: "Samedi" },
    { value: 0, label: "Dimanche" },
  ];

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

  const toggleDay = (dayValue) => {
    setFormData((prev) => {
      const exists = prev.allowedDays.includes(dayValue);
      return {
        ...prev,
        allowedDays: exists
          ? prev.allowedDays.filter((d) => d !== dayValue)
          : [...prev.allowedDays, dayValue],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id_ia: formData.id_ia || null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
    });
  };

  // ✅ Le script affiché dépend du type d'appel
  const isInbound = formData.callType === "inbound";

  return (
    <div
      className="agentModalOverlay"
      onClick={!loadingUpdate ? onClose : undefined}
    >
      <div
        className={`agentModal ${loadingUpdate ? "agentModal--loading" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="agentModalHeader">
          <h2>
            {selectedCompagne ? "Modifier la campagne" : "Créer une campagne"}
          </h2>
          <button type="button" className="closeBtn" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="agentForm">
          <div className="formGrid">

            {/* Nom campagne */}
            <div className="formGroup">
              <label>Nom de la campagne</label>
              <input
                name="nomCompagne"
                value={formData.nomCompagne}
                onChange={handleChange}
                required
              />
            </div>

            {/* Numéro */}
            <div className="formGroup">
              <label>Numéro</label>
              <input
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                required
              />
            </div>

            {/* Agent IA */}
            <div className="formGroup">
              <label>Agent IA associé</label>
              <select
                name="id_ia"
                value={formData.id_ia}
                onChange={handleChange}
              >
                <option value="">Sélectionner un agent</option>
                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.nomAgent || agent.companyName || "Agent sans nom"}
                  </option>
                ))}
              </select>
            </div>

            {/* Statut */}
            <div className="formGroup">
              <label>Statut</label>
              <select
                name="active"
                value={formData.active}
                onChange={handleChange}
              >
                <option value={1}>Actif</option>
                <option value={0}>Inactif</option>
              </select>
            </div>

            {/* ✅ Type d'appel — nom corrigé, valeurs métier claires */}
            <div className="formGroup">
              <label>Type d'appel</label>
              <select
                name="callType"
                value={formData.callType}
                onChange={handleChange}
              >
                <option value="outbound">📞 Sortant</option>
                <option value="inbound">📲 Entrant</option>
              </select>
            </div>

            {!isInbound && (
              <div className="formGroup">
                <label>Bruit de fond</label>

                <label
                  className="ficheCheckItem"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.backgroundNoise}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        backgroundNoise: e.target.checked,
                      }))
                    }
                  />
                  <span>Activer l’ambiance centre d’appels</span>
                </label>

                <div className="formHint">
                  Si activé, un bruit de fond léger sera joué pendant les silences de l’agent.
                </div>
              </div>
            )}

            {/* Timeout — masqué en entrant (pas de dial timeout utile) */}
            {!isInbound && (
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
            )}

            {/* Jours autorisés */}
            <div className="formGroup full">
              <label>Jours autorisés</label>
              <div className="fichesCheckList">
                {DAYS.map((day) => (
                  <label key={day.value} className="ficheCheckItem">
                    <input
                      type="checkbox"
                      checked={formData.allowedDays.includes(day.value)}
                      onChange={() => toggleDay(day.value)}
                    />
                    <span>{day.label}</span>
                  </label>
                ))}
              </div>
              <div className="formHint">
                Exemple : cochez lundi à vendredi pour autoriser les appels en semaine.
              </div>
            </div>

            {/* Heure début */}
            <div className="formGroup">
              <label>Heure début</label>
              <input
                type="time"
                name="startHour"
                value={formData.startHour}
                onChange={handleChange}
              />
            </div>

            {/* Heure fin */}
            <div className="formGroup">
              <label>Heure fin</label>
              <input
                type="time"
                name="endHour"
                value={formData.endHour}
                onChange={handleChange}
              />
            </div>

            {/* Fuseau horaire */}
            <div className="formGroup">
              <label>Fuseau horaire</label>
              <select
                name="timeZone"
                value={formData.timeZone}
                onChange={handleChange}
              >
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Indian/Antananarivo">Madagascar</option>
              </select>
            </div>

          </div>

          {/* Fiches CSV — masquées en entrant (pas de liste à appeler) */}
          {!isInbound && (
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
          )}

          {/* Appels simultanés */}
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
              <span className="concurrentBadge">
                {formData.maxConcurrentCalls}
              </span>
            </div>
            <div className="concurrentLabels">
              <span>1 (séquentiel)</span>
              <span>5</span>
              <span>10 (max)</span>
            </div>
          </div>

          {/* ✅ Script IA — label et hint adaptatifs selon callType */}
          <div className="formGroup full">
            <label>
              {isInbound ? "Script IA — Appel entrant" : "Script IA — Appel sortant"}
            </label>
            <div className="formHint" style={{ marginBottom: 6 }}>
              {isInbound
                ? "Ce script est injecté dans ia.js (réception d'appel). L'IA en extrait automatiquement son identité, ses horaires et ses procédures."
                : "Ce script pilote l'agent sortant. Décrivez l'objectif de l'appel, l'accroche et les objections à gérer."}
            </div>
            <textarea
              name="script"
              value={formData.script}
              onChange={handleChange}
              rows="10"
              placeholder={
                isInbound
                  ? "##IDENTITE##\nNOM_AGENT: ...\nNOM_ENTREPRISE: ...\n\n##PHRASE_OUVERTURE##\n\"Bonjour, [Entreprise], [Prénom] à l'appareil...\"\n\n##HORAIRES##\n..."
                  : "Tu es [Prénom], commercial(e) de [Entreprise].\nObjectif : ...\nAccroche : ...\nObjections fréquentes : ..."
              }
              required
            />
          </div>


          {/* Aperçu script final (lecture seule) */}
          {selectedCompagne?.scriptFinal && (
            <div className="formGroup full">
              <label>Aperçu du script final</label>
              <textarea
                value={selectedCompagne.scriptFinal}
                readOnly
                rows="8"
              />
            </div>
          )}

          <div className="agentModalActions">
            <button
              type="button"
              className="btn btnGhost"
              onClick={onClose}
              disabled={loadingUpdate}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btnPrimary"
              disabled={loadingUpdate}
            >
              {loadingUpdate ? (
                <span className="loadingSpinner" />
              ) : selectedCompagne ? (
                "Mettre à jour"
              ) : (
                "Créer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}