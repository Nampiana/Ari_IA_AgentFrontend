import React, { useEffect, useRef, useState } from "react";
import "../../assets/css/CompagneFormModal.css";
import {
  TIMEZONES,
  getTimezoneMeta,
  getZonedOffsetLabel,
  isWithinSchedule,
} from "../../utils/timezoneUtils";

const normalizePhoneNumber = (value) =>
  String(value || "")
    .trim()
    .replace(/[^0-9]/g, "");

const getInitialFormData = (selectedCompagne) => ({
  nomCompagne: selectedCompagne?.nomCompagne || "",
  numero: selectedCompagne?.numero || "",
  numeros: Array.isArray(selectedCompagne?.numeros)
    ? selectedCompagne.numeros.join("\n")
    : "",
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
  tranchesHoraires:
    Array.isArray(selectedCompagne?.tranchesHoraires) &&
    selectedCompagne.tranchesHoraires.length
      ? selectedCompagne.tranchesHoraires
      : [
          {
            startHour: selectedCompagne?.startHour || "08:00",
            endHour: selectedCompagne?.endHour || "21:00",
          },
        ],
  timeZone: selectedCompagne?.timeZone || "Europe/Paris",
  callType: selectedCompagne?.callType || "outbound",
  backgroundNoise: selectedCompagne?.backgroundNoise ?? false,
  companyName: selectedCompagne?.companyName || "",
});

const DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
  { value: 0, label: "Dim" },
];

const TABS = [
  { id: "identite", label: "Identité", icon: "bi-person-vcard" },
  { id: "agent", label: "Agent IA", icon: "bi-cpu" },
  { id: "planning", label: "Planning", icon: "bi-calendar-week" },
  { id: "options", label: "Options", icon: "bi-sliders" },
];

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
    <div className="campMultiSelect" ref={containerRef}>
      <button
        type="button"
        className="campMultiSelect__trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedLists.length === 0 ? (
          <span className="campMultiSelect__placeholder">
            Sélectionner une ou plusieurs fiches
          </span>
        ) : (
          <div className="campMultiSelect__tags">
            {selectedLists.map((list) => (
              <span key={list._id} className="campMultiSelect__tag">
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
          className={`bi bi-chevron-${open ? "up" : "down"} campMultiSelect__chevron`}
        />
      </button>

      {open && (
        <div className="campMultiSelect__dropdown">
          {lists.length === 0 ? (
            <div className="campHint campMultiSelect__empty">
              Aucune liste disponible
            </div>
          ) : (
            lists.map((list) => (
              <label key={list._id} className="campMultiSelect__option">
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

// ── Widget horloge live + statut "dans/hors plage d'appel" ─────────────────
// Se met à jour chaque seconde tant que la modale est ouverte.
function TimezoneScheduleWidget({ timeZone, allowedDays, tranches }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tz = timeZone || "Europe/Paris";
  const meta = getTimezoneMeta(tz);

  const timeLabel = now.toLocaleTimeString("fr-FR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const dateLabel = now.toLocaleDateString("fr-FR", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const offsetLabel = getZonedOffsetLabel(now, tz);
  const isOpen = isWithinSchedule(now, tz, allowedDays, tranches);

  return (
    <div className="campTzWidget">
      <div className="campTzWidget__zone">
        <span className="campTzWidget__flag">{meta.flag}</span>
        <div>
          <strong>{meta.label}</strong>
          <span className="campTzWidget__offset">
            {offsetLabel} · {dateLabel}
          </span>
        </div>
      </div>

      <div className="campTzWidget__time">{timeLabel}</div>

      <span
        className={`campTzWidget__status ${isOpen ? "is-open" : "is-closed"}`}
      >
        <i
          className={`bi ${isOpen ? "bi-telephone-fill" : "bi-moon-stars-fill"}`}
        />
        {isOpen ? "Dans la plage d'appel" : "Hors plage d'appel"}
      </span>
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
  const [activeTab, setActiveTab] = useState("identite");

  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(selectedCompagne));
      setActiveTab("identite");
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

  const updateTranche = (index, field, value) => {
    setFormData((prev) => {
      const tranches = [...prev.tranchesHoraires];
      tranches[index] = { ...tranches[index], [field]: value };
      return { ...prev, tranchesHoraires: tranches };
    });
  };

  const addTranche = () => {
    setFormData((prev) => ({
      ...prev,
      tranchesHoraires: [
        ...prev.tranchesHoraires,
        { startHour: "08:00", endHour: "21:00" },
      ],
    }));
  };

  const removeTranche = (index) => {
    setFormData((prev) => ({
      ...prev,
      tranchesHoraires: prev.tranchesHoraires.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numeroPrincipal = normalizePhoneNumber(formData.numero);
    const numerosSecondaires = [
      ...new Set(
        String(formData.numeros || "")
          .split(/\r?\n|,|;/)
          .map(normalizePhoneNumber)
          .filter(Boolean),
      ),
    ].filter((numero) => numero !== numeroPrincipal);

    onSubmit({
      ...formData,
      numero: numeroPrincipal,
      numeros: numerosSecondaires,
      id_ia: formData.id_ia || null,
    });
  };

  const isInbound = formData.callType === "inbound";
  const numeroNormalise = normalizePhoneNumber(formData.numero);

  const tabValidity = {
    identite:
      formData.nomCompagne.trim() !== "" &&
      numeroNormalise.length >= 8 &&
      formData.companyName.trim() !== "",
    agent: formData.id_ia !== "" && formData.script.trim() !== "",
    planning:
      formData.allowedDays.length > 0 &&
      formData.tranchesHoraires.length > 0 &&
      formData.tranchesHoraires.every((t) => t.startHour && t.endHour) &&
      formData.timeZone !== "",
    options:
      formData.maxConcurrentCalls >= 1 &&
      (isInbound ||
        (formData.dialTimeout >= 5 && formData.dialTimeout <= 120)) &&
      (isInbound || formData.fiches.length > 0),
  };

  const isFormValid =
    Object.values(tabValidity).every(Boolean) && formData.callType !== "";

  const selectedAgentName =
    agents.find((a) => a._id === formData.id_ia)?.nomAgent ||
    "Aucun agent sélectionné";

  return (
    <div className="campModalOverlay">
      <div
        className={`campModal ${loadingUpdate ? "campModal--loading" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="campModal__header">
          <div className="campModal__headerLeft">
            <span className="campModal__badge">
              <i className="bi bi-broadcast" />
            </span>
            <div>
              <h2>
                {selectedCompagne
                  ? "Modifier la campagne"
                  : "Nouvelle campagne"}
              </h2>
              <p>
                {selectedCompagne
                  ? formData.nomCompagne || "Configuration de la campagne"
                  : "Configurez un agent IA pour vos appels"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="campModal__close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="campModal__form">
          <div className="campModal__body">
            <nav className="campModal__rail">
              {TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  className={`campRailItem ${activeTab === tab.id ? "is-active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={`bi ${tab.icon}`} />
                  <span>{tab.label}</span>
                  {!tabValidity[tab.id] && (
                    <span className="campRailItem__dot" />
                  )}
                </button>
              ))}

              <div className="campPreview">
                <span className="campPreview__label">
                  <i className="bi bi-eye" /> Aperçu
                </span>
                <div
                  className={`campPreviewCard campPreviewCard--${isInbound ? "in" : "out"}`}
                >
                  <span className="campPreviewCard__tag">
                    <i
                      className={`bi ${isInbound ? "bi-telephone-inbound-fill" : "bi-telephone-outbound-fill"}`}
                    />
                    {isInbound ? "Entrant" : "Sortant"}
                  </span>
                  <strong className="campPreviewCard__name">
                    {formData.nomCompagne || "Nom de la campagne"}
                  </strong>
                  <span className="campPreviewCard__num">
                    <i className="bi bi-telephone" /> {formData.numero || "—"}
                  </span>
                  <span className="campPreviewCard__agent">
                    <i className="bi bi-cpu" /> {selectedAgentName}
                  </span>
                </div>
              </div>
            </nav>

            <div className="campModal__content">
              {activeTab === "identite" && (
                <section className="campSection">
                  <h3 className="campSection__title">
                    Identité de la campagne
                  </h3>
                  <p className="campSection__desc">
                    Nommez votre campagne et choisissez le sens des appels.
                  </p>

                  <div className="campSegmented">
                    <button
                      type="button"
                      className={`campSegmented__option ${!isInbound ? "is-active" : ""}`}
                      onClick={() =>
                        setFormData((p) => ({ ...p, callType: "outbound" }))
                      }
                    >
                      <i className="bi bi-telephone-outbound-fill" /> Sortant
                    </button>
                    <button
                      type="button"
                      className={`campSegmented__option is-in ${isInbound ? "is-active" : ""}`}
                      onClick={() =>
                        setFormData((p) => ({ ...p, callType: "inbound" }))
                      }
                    >
                      <i className="bi bi-telephone-inbound-fill" /> Entrant
                    </button>
                  </div>

                  <div className="campFormGrid">
                    <div className="campFormGroup">
                      <label className="campLabel">Nom de la campagne</label>
                      <input
                        className="campInput"
                        name="nomCompagne"
                        value={formData.nomCompagne}
                        onChange={handleChange}
                        placeholder="Ex. Relance clients Q3"
                        required
                      />
                    </div>

                    <div className="campFormGroup">
                      <label className="campLabel">Numéro principal</label>
                      <input
                        className="campInput campMono"
                        name="numero"
                        value={formData.numero}
                        onChange={handleChange}
                        placeholder="33162080441"
                        required
                      />
                    </div>

                    <div className="campFormGroup">
                      <label className="campLabel">Société</label>
                      <input
                        className="campInput"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Nom de la société"
                      />
                    </div>

                    <div className="campFormGroup campFormGroup--full">
                      <label className="campLabel">
                        {isInbound
                          ? "Autres numéros entrants"
                          : "Numéros sortants en rotation"}
                        <span className="campHint">
                          {" "}
                          (optionnel — un par ligne)
                        </span>
                      </label>
                      <textarea
                        className="campTextarea campMono"
                        name="numeros"
                        value={formData.numeros}
                        onChange={handleChange}
                        rows={4}
                        placeholder={"33162080441\n33377080258\n33745895056"}
                      />
                      <div className="campHint">
                        {isInbound
                          ? "Tout appel reçu sur l'un de ces numéros utilisera le même agent IA, le même script et la même configuration que le numéro principal."
                          : "Ces numéros seront utilisés en boucle à la place du numéro principal pour répartir les appels sortants."}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "agent" && (
                <section className="campSection">
                  <h3 className="campSection__title">Agent IA & script</h3>
                  <p className="campSection__desc">
                    Choisissez l'agent qui prendra les appels et rédigez ses
                    instructions.
                  </p>

                  <div className="campFormGrid">
                    <div className="campFormGroup campFormGroup--full">
                      <label className="campLabel">Agent IA associé</label>
                      <select
                        className="campSelect"
                        name="id_ia"
                        value={formData.id_ia}
                        onChange={handleChange}
                      >
                        <option value="">Sélectionner un agent</option>
                        {agents.map((agent) => (
                          <option key={agent._id} value={agent._id}>
                            {agent.nomAgent ||
                              agent.companyName ||
                              "Agent sans nom"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="campFormGroup campFormGroup--full">
                      <label className="campLabel">
                        {isInbound
                          ? "Script IA — Appel entrant"
                          : "Script IA — Appel sortant"}
                      </label>
                      <div className="campHint" style={{ marginBottom: 8 }}>
                        {isInbound
                          ? "Ce script est injecté dans ia.js (réception d'appel). L'IA en extrait automatiquement son identité, ses horaires et ses procédures."
                          : "Ce script pilote l'agent sortant. Décrivez l'objectif de l'appel, l'accroche et les objections à gérer."}
                      </div>
                      <textarea
                        className="campTextarea campMono campTextarea--code"
                        name="script"
                        value={formData.script}
                        onChange={handleChange}
                        rows={10}
                        placeholder={
                          isInbound
                            ? '##IDENTITE##\nNOM_AGENT: ...\nNOM_ENTREPRISE: ...\n\n##PHRASE_OUVERTURE##\n"Bonjour, [Entreprise], [Prénom] à l\'appareil..."\n\n##HORAIRES##\n...'
                            : "Tu es [Prénom], commercial(e) de [Entreprise].\nObjectif : ...\nAccroche : ...\nObjections fréquentes : ..."
                        }
                        required
                      />
                    </div>

                    {selectedCompagne?.scriptFinal && (
                      <div className="campFormGroup campFormGroup--full">
                        <label className="campLabel">
                          Aperçu du script final
                        </label>
                        <textarea
                          className="campTextarea campMono campTextarea--readonly"
                          value={selectedCompagne.scriptFinal}
                          readOnly
                          rows={8}
                        />
                      </div>
                    )}
                  </div>
                </section>
              )}

              {activeTab === "planning" && (
                <section className="campSection">
                  <h3 className="campSection__title">
                    Fuseau horaire & tranches d'appel
                  </h3>
                  <p className="campSection__desc">
                    Le fuseau choisi s'applique à toutes les tranches horaires
                    ci-dessous et détermine l'heure locale utilisée pour
                    respecter le planning.
                  </p>

                  <div className="campFormGrid">
                    <div className="campFormGroup">
                      <label className="campLabel">Fuseau horaire</label>
                      <select
                        className="campSelect"
                        name="timeZone"
                        value={formData.timeZone}
                        onChange={handleChange}
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.flag} {tz.label}
                          </option>
                        ))}
                      </select>
                      <div className="campHint">
                        S'applique à l'ensemble des tranches horaires de cette
                        campagne.
                      </div>
                    </div>

                    <div className="campFormGroup">
                      <label className="campLabel">Heure locale actuelle</label>
                      <TimezoneScheduleWidget
                        timeZone={formData.timeZone}
                        allowedDays={formData.allowedDays}
                        tranches={formData.tranchesHoraires}
                      />
                    </div>
                  </div>

                  <div className="campFormGroup campFormGroup--full">
                    <label className="campLabel">
                      Tranches horaires
                      <span className="campHint">
                        {" "}
                        (une ou plusieurs plages d'appel autorisées, en heure
                        locale du fuseau sélectionné)
                      </span>
                    </label>

                    <div className="campTranches">
                      {formData.tranchesHoraires.map((tranche, index) => (
                        <div className="campTrancheRow" key={index}>
                          <input
                            type="time"
                            className="campInput campMono"
                            value={tranche.startHour}
                            onChange={(e) =>
                              updateTranche(index, "startHour", e.target.value)
                            }
                          />
                          <span className="campTrancheRow__sep">à</span>
                          <input
                            type="time"
                            className="campInput campMono"
                            value={tranche.endHour}
                            onChange={(e) =>
                              updateTranche(index, "endHour", e.target.value)
                            }
                          />
                          {formData.tranchesHoraires.length > 1 && (
                            <button
                              type="button"
                              className="campIconBtn campIconBtn--delete"
                              onClick={() => removeTranche(index)}
                              aria-label="Supprimer cette tranche"
                            >
                              <i className="bi bi-x-lg" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="campBtnGhost campBtnGhost--sm"
                      onClick={addTranche}
                    >
                      <i className="bi bi-plus-lg" /> Ajouter une tranche
                      horaire
                    </button>

                    <div className="campHint">
                      Exemple : 08:00–12:00 puis 14:00–18:00 pour une pause
                      déjeuner.
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "options" && (
                <section className="campSection">
                  <h3 className="campSection__title">Options avancées</h3>
                  <p className="campSection__desc">
                    Ajustez le comportement de l'agent pendant les appels.
                  </p>

                  <div className="campFormGrid">
                    <div className="campFormGroup">
                      <label className="campLabel">Statut</label>
                      <select
                        className="campSelect"
                        name="active"
                        value={formData.active}
                        onChange={handleChange}
                      >
                        <option value={1}>Actif</option>
                        <option value={0}>Inactif</option>
                      </select>
                    </div>

                    {!isInbound && (
                      <div className="campFormGroup">
                        <label className="campLabel">
                          Timeout d'appel{" "}
                          <span className="campHint">(secondes)</span>
                        </label>
                        <input
                          type="number"
                          className="campInput campMono"
                          name="dialTimeout"
                          min={5}
                          max={120}
                          value={formData.dialTimeout}
                          onChange={handleChange}
                        />
                      </div>
                    )}

                    <div className="campFormGroup campFormGroup--full">
                      <label className="campSwitch">
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
                        <span className="campSwitch__track">
                          <span className="campSwitch__thumb" />
                        </span>
                        <span className="campSwitch__label">
                          Ambiance centre d'appels
                          <span className="campHint">
                            {" "}
                            — joue un bruit de fond léger pendant les silences
                            de l'agent
                          </span>
                        </span>
                      </label>
                    </div>

                    <div className="campFormGroup campFormGroup--full">
                      <label className="campLabel">
                        Appels simultanés{" "}
                        <span className="campHint">
                          (agents IA actifs en même temps)
                        </span>
                      </label>
                      <div className="campRange">
                        <input
                          type="range"
                          name="maxConcurrentCalls"
                          min={1}
                          max={10}
                          step={1}
                          value={formData.maxConcurrentCalls}
                          onChange={handleChange}
                          className="campRange__input"
                          style={{
                            "--camp-range-fill": `${((formData.maxConcurrentCalls - 1) / 9) * 100}%`,
                          }}
                        />
                        <span className="campRange__badge">
                          {formData.maxConcurrentCalls}
                        </span>
                      </div>
                      <div className="campRange__labels">
                        <span>1 · séquentiel</span>
                        <span>5</span>
                        <span>10 · max</span>
                      </div>
                    </div>

                    {!isInbound && (
                      <div className="campFormGroup campFormGroup--full">
                        <label className="campLabel">
                          Fiches (listes CSV){" "}
                          <span className="campHint">
                            (plusieurs listes possibles)
                          </span>
                        </label>
                        <FichesMultiSelect
                          lists={lists}
                          selectedIds={formData.fiches}
                          onToggle={toggleFiche}
                        />
                        {formData.fiches.length > 0 && (
                          <div className="campHint">
                            {formData.fiches.length} liste(s) sélectionnée(s)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>

          <footer className="campModal__footer">
            {!isFormValid && !loadingUpdate && (
              <span className="campModal__error">
                <i className="bi bi-exclamation-circle" /> Complétez les champs
                obligatoires dans tous les onglets
              </span>
            )}
            <div className="campModal__actions">
              <button
                type="button"
                className="campBtnGhost"
                onClick={onClose}
                disabled={loadingUpdate}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="campBtnSubmit"
                disabled={loadingUpdate || !isFormValid}
              >
                {loadingUpdate ? (
                  <span className="campSpinner" />
                ) : selectedCompagne ? (
                  "Mettre à jour"
                ) : (
                  "Créer la campagne"
                )}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
