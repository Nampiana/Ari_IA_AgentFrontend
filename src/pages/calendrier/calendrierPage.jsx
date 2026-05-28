import React, { useEffect, useMemo, useState, useCallback } from "react";
import HeaderBar from "../../components/agents/HeaderBar";
import useScheduledCall from "../../hooks/useScheduledCall";
import useHistoriqueIa from "../../hooks/useHistoriqueIa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/css/calendrierPage.css";
import { buildRecordUrl } from "../../utils/buildPathAudio";

// ─── Constantes ────────────────────────────────────────────────────────────────

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/**
 * Convertit getDay() (0=Dim … 6=Sam) en index lundi-first (0=Lun … 6=Dim)
 */
function mondayFirstIndex(date) {
  return (date.getDay() + 6) % 7;
}

/**
 * Retourne "YYYY-MM-DD" dans le fuseau LOCAL
 */
function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Formate la durée en secondes → "Xmin Ys"
 */
function formatDuration(billsec) {
  if (!billsec && billsec !== 0) return "—";
  const min = Math.floor(billsec / 60);
  const sec = billsec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}min ${sec}s`;
}

// ─── Couleurs & Labels ─────────────────────────────────────────────────────────

const REASON_COLOR = {
  RAPPEL: "bg-warning",
  CALLBACK: "bg-warning",   // ← alias MongoDB
  NI: "bg-danger",
  OCCUPE: "bg-gris",
  REPONDEUR: "bg-info",
  SALE: "bg-success",
};

const REASON_LABEL = {
  RAPPEL: "Rappel",
  CALLBACK: "Rappel",       // ← alias MongoDB
  NI: "Non intéressé",
  OCCUPE: "Occupé",
  REPONDEUR: "Répondeur",
  SALE: "Vente / RDV",
};
// status MongoDB : 1=NI, 2=SALE, 3=CALLBACK, 4=OCCUPE, 5=REPONDEUR
const STATUS_LABEL = {
  1: { label: "Non intéressé", cls: "bg-danger", reason: "NI" },
  2: { label: "Vente / RDV", cls: "bg-success", reason: "SALE" },
  3: { label: "Rappel", cls: "bg-warning text-dark", reason: "RAPPEL" },
  4: { label: "Occupé", cls: "bg-gris", reason: "OCCUPE" },
  5: { label: "Répondeur", cls: "bg-info", reason: "REPONDEUR" },
  CALLBACK: { label: "Rappel", cls: "bg-warning text-dark", reason: "RAPPEL" }, // ← alias
};

const FILTER_CHIPS = [
  { key: "ALL", label: "Tous", cls: "btn-outline-secondary" },
  {
    key: "RAPPEL",
    label: "Rappel",
    cls: "btn-warning",
    dotCls: "bg-warning",
  },
  { key: "NI", label: "Non intéressé", cls: "btn-danger", dotCls: "bg-danger" },
  {
    key: "OCCUPE",
    label: "Occupé",
    cls: "btn-gris",
    dotCls: "bg-gris",
  },
  { key: "REPONDEUR", label: "Répondeur", cls: "btn-info", dotCls: "bg-info" },
  {
    key: "SALE",
    label: "Vente / RDV",
    cls: "btn-success",
    dotCls: "bg-success",
  },
];

const SCHEDULED_STATUS = {
  pending: { label: "En attente", cls: "bg-warning text-dark" },
  running: { label: "En cours", cls: "bg-info text-dark" },
  done: { label: "Terminé", cls: "bg-success" },
  failed: { label: "Échec", cls: "bg-danger" },
};

// ─── Composant principal ───────────────────────────────────────────────────────

export default function CalendrierPage() {
  const { getScheduledCalls, deleteScheduledCall } = useScheduledCall();
  const { getHistoriques } = useHistoriqueIa();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledCalls, setScheduledCalls] = useState([]);
  const [historiques, setHistoriques] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Filtres ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // clé reason ou "ALL"
  const [agentFilter, setAgentFilter] = useState(""); // _id agentIaId
  const [campagneFilter, setCampagneFilter] = useState(""); // _id campagneId

  // ── Chargement ────────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scheduledRes, historiquesRes] = await Promise.all([
        getScheduledCalls(),
        getHistoriques({ status: 2 }),
      ]);
      setScheduledCalls(scheduledRes?.data?.data || []);
      setHistoriques(historiquesRes?.data?.data || []);
    } catch (err) {
      console.error("Erreur chargement calendrier:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setAgentFilter("");
    setCampagneFilter("");
  };

  // ── Listes d'agents / campagnes uniques pour les selects ──
  const agentOptions = useMemo(() => {
    const map = new Map();
    [...historiques, ...scheduledCalls].forEach((item) => {
      const id = item?.agentIaId?._id;
      const name = item.aiResponse?.nameUser || `Agent ${id?.slice(-5)}`;
      if (id && !map.has(String(id))) map.set(String(id), name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    }));
  }, [historiques, scheduledCalls]);

  const campagneOptions = useMemo(() => {
    const map = new Map();
    [...historiques, ...scheduledCalls].forEach((item) => {
      const id = item.campagneId;
      if (id && !map.has(String(id))) map.set(String(id), String(id));
    });
    return Array.from(map.entries()).map(([id]) => ({
      value: id,
      label: `Campagne ${id.slice(-5)}`,
    }));
  }, [historiques, scheduledCalls]);

  // ── Filtre générique ──────────────────────────────────────
  const matchesFilters = useCallback(
    (item, isHistorique) => {
      const q = searchQuery.trim().toLowerCase();

      // Recherche textuelle : numéro ou nom
      if (q) {
        const num = (item.calledNumber || "").toLowerCase();
        const name = (item.aiResponse?.nameUser || "").toLowerCase();
        if (!num.includes(q) && !name.includes(q)) return false;
      }

      // Filtre statut/reason
      if (statusFilter !== "ALL") {
        const reason = isHistorique
          ? STATUS_LABEL[item.status]?.reason || ""
          : item.reason || "";
        if (reason !== statusFilter) return false;
      }

      // Filtre agent
      if (agentFilter && String(item.agentIaId) !== agentFilter) return false;

      // Filtre campagne
      if (campagneFilter && String(item.campagneId) !== campagneFilter)
        return false;

      return true;
    },
    [searchQuery, statusFilter, agentFilter, campagneFilter],
  );

  // ── Calcul du mois ────────────────────────────────────────
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = mondayFirstIndex(firstDay);
  const totalDays = lastDay.getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));

  const monthLabel = currentDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const todayKey = toLocalDateKey(new Date());

  // ── Groupement filtré par date locale ─────────────────────
  const groupedData = useMemo(() => {
    const map = {};

    historiques
      .filter((h) => matchesFilters(h, true))
      .forEach((h) => {
        if (!h.callDate) return;
        const key = toLocalDateKey(new Date(h.callDate));
        if (!map[key]) map[key] = { historiques: [], scheduled: [] };
        map[key].historiques.push(h);
      });

    scheduledCalls
      .filter((s) => matchesFilters(s, false))
      .forEach((s) => {
        if (!s.scheduledAt) return;
        const key = toLocalDateKey(new Date(s.scheduledAt));
        if (!map[key]) map[key] = { historiques: [], scheduled: [] };
        map[key].scheduled.push(s);
      });

    return map;
  }, [historiques, scheduledCalls, matchesFilters]);

  // Compte total des résultats filtrés (tous mois confondus)
  const filteredTotal = useMemo(() => {
    const fH = historiques.filter((h) => matchesFilters(h, true)).length;
    const fS = scheduledCalls.filter((s) => matchesFilters(s, false)).length;
    return fH + fS;
  }, [historiques, scheduledCalls, matchesFilters]);

  const hasActiveFilter =
    searchQuery.trim() !== "" ||
    statusFilter !== "ALL" ||
    agentFilter !== "" ||
    campagneFilter !== "";

  // ── Navigation ────────────────────────────────────────────
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // ── Suppression rappel ────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce rappel planifié ?")) return;
    try {
      await deleteScheduledCall(id);
      setScheduledCalls((prev) => prev.filter((item) => item._id !== id));
      // Met à jour la modale si elle est ouverte sur ce même jour
      setSelectedDay((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            scheduled: prev.data.scheduled.filter((item) => item._id !== id),
          },
        };
      });
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  // ── Rendu ─────────────────────────────────────────────────
  return (
    <div className="calendrierPage bg-light min-vh-100">
      <HeaderBar />

      <div className="container-fluid p-1 p-md-5">
        <div
          className="card border-0 shadow-sm mb-4 p-3"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="d-flex flex-column flex-md-row gap-2 align-items-stretch align-items-md-center mb-3">
            <div className="input-group mobile-min-width">
              <span className="input-group-text bg-white">
                <i className="bi bi-search" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="N° de téléphone, nom client…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setSearchQuery("")}
                  title="Effacer"
                >
                  ×
                </button>
              )}
            </div>

            <select
              className="form-select mobile-min-width"
              style={{ flex: 1 }}
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
            >
              <option value="">Tous les agents IA</option>
              {agentOptions.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>

            <select
              className="form-select mobile-min-width"
              style={{ flex: 1 }}
              value={campagneFilter}
              onChange={(e) => setCampagneFilter(e.target.value)}
            >
              <option value="">Toutes les campagnes</option>
              {campagneOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {hasActiveFilter && (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={resetFilters}
              >
                ✕ Réinitialiser les filtres
              </button>
            )}
          </div>

          {/* Ligne 2 : chips statut */}
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {FILTER_CHIPS.map(({ key, label, cls, dotCls }) => (
              <button
                key={key}
                className={`btn btn-sm d-flex align-items-center gap-1 ${
                  statusFilter === key ? cls : "btn-outline-secondary"
                }`}
                onClick={() => setStatusFilter(key)}
              >
                {dotCls && (
                  <span
                    className={`rounded-circle ${
                      statusFilter === key ? "bg-white" : dotCls
                    }`}
                    style={{
                      width: 8,
                      height: 8,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                )}
                {label}
              </button>
            ))}

            {/* Compteur résultats */}
            {hasActiveFilter && (
              <span className="ms-2 text-muted small">
                {filteredTotal} résultat{filteredTotal > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* ── LÉGENDE ── */}
        <div className="d-flex flex-wrap gap-4 mb-4">
          {[
            { cls: "bg-warning", label: "Rappel" },
            { cls: "bg-danger", label: "Non intéressé" },
            { cls: "bg-gris", label: "Occupé" },
            { cls: "bg-info", label: "Répondeur" },
            { cls: "bg-success", label: "RDV / Vente" },
          ].map(({ cls, label }) => (
            <div key={label} className="d-flex align-items-center gap-2">
              <span
                className={`rounded-circle ${cls}`}
                style={{ width: 12, height: 12, display: "inline-block" }}
              />
              <small className="text-muted">{label}</small>
            </div>
          ))}
        </div>

        {/* ── NAVIGATION MOIS ── */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button className="btn btn-outline-primary" onClick={prevMonth}>
            ←
          </button>
          <div className="d-flex align-items-center gap-3">
            <h3 className="fw-bold text-capitalize m-0">{monthLabel}</h3>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={goToday}
            >
              Aujourd'hui
            </button>
          </div>
          <button className="btn btn-outline-primary" onClick={nextMonth}>
            →
          </button>
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div className="alert alert-info">Chargement du calendrier…</div>
        )}

        {/* ── EN-TÊTES JOURS ── */}
        <div className="row g-1 mb-1 text-center fw-bold text-muted small">
          {WEEK_DAYS.map((d) => (
            <div
              key={d}
              className="col"
              style={{ minWidth: "14.2%", maxWidth: "14.2%" }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* ── GRILLE CALENDRIER ── */}
        <div className="row g-1">
          {cells.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="col"
                  style={{
                    minWidth: "14.2%",
                    maxWidth: "14.2%",
                    minHeight: 120,
                  }}
                />
              );
            }

            const key = toLocalDateKey(day);
            const data = groupedData[key] || { historiques: [], scheduled: [] };
            const total = data.historiques.length + data.scheduled.length;
            const isToday = key === todayKey;
            const hasData = total > 0;

            return (
              <div
                key={key}
                className="col"
                style={{ minWidth: "14.2%", maxWidth: "14.2%" }}
              >
                <div
                  className={`card border-0 shadow-sm h-100 ${
                    isToday ? "border border-primary border-2" : ""
                  }`}
                  style={{
                    minHeight: 120,
                    cursor: hasData ? "pointer" : "default",
                    outline: isToday ? "2px solid #0d6efd" : "none",
                    opacity: hasActiveFilter && !hasData ? 0.45 : 1,
                  }}
                  onClick={() => hasData && setSelectedDay({ date: key, data })}
                >
                  <div className="card-body p-2">
                    {/* Numéro du jour */}
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div
                        className={`fw-bold ${
                          isToday
                            ? "text-white bg-primary rounded-circle d-flex align-items-center justify-content-center"
                            : ""
                        }`}
                        style={
                          isToday ? { width: 26, height: 26, fontSize: 13 } : {}
                        }
                      >
                        {day.getDate()}
                      </div>
                      {total > 0 && (
                        <span
                          className="badge bg-dark"
                          style={{ fontSize: 10 }}
                        >
                          {total}
                        </span>
                      )}
                    </div>

                    {/* Historiques */}
                    {data.historiques.slice(0, 2).map((h) => {
                      const sm = STATUS_LABEL[h.status];
                      return (
                        <div
                          key={h._id}
                          className="d-flex align-items-center gap-1 mb-1"
                          style={{ fontSize: 11 }}
                        >
                          <span
                            className={`rounded-circle flex-shrink-0 ${
                              sm?.cls?.split(" ")[0] || "bg-secondary"
                            }`}
                            style={{
                              width: 8,
                              height: 8,
                              display: "inline-block",
                            }}
                          />
                          <span className="text-truncate text-muted">
                            {h.calledNumber}
                          </span>
                        </div>
                      );
                    })}

                    {/* Rappels planifiés */}
                    {data.scheduled.slice(0, 2).map((s) => (
                      <div
                        key={s._id}
                        className="d-flex align-items-center gap-1 mb-1"
                        style={{ fontSize: 11 }}
                      >
                        <span
                          className={`rounded-circle flex-shrink-0 ${
                            REASON_COLOR[s.reason] ?? "bg-secondary"
                          }`}
                          style={{
                            width: 8,
                            height: 8,
                            display: "inline-block",
                          }}
                        />
                        <span className="text-truncate text-muted">
                          {s.calledNumber}
                        </span>
                      </div>
                    ))}

                    {/* +N autres */}
                    {total > 4 && (
                      <div style={{ fontSize: 10 }} className="text-muted">
                        +{total - 4} autre{total - 4 > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODAL DÉTAIL DU JOUR ── */}
      {selectedDay && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDay(null);
          }}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              {/* Header modale */}
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  📅{" "}
                  {new Date(selectedDay.date + "T12:00:00").toLocaleDateString(
                    "fr-FR",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setSelectedDay(null)}
                />
              </div>

              <div className="modal-body">
                {/* ── SECTION : Historique appels ── */}
                <h6 className="fw-bold mb-3 text-primary">
                  📞 Historique appels ({selectedDay.data.historiques.length})
                </h6>

                {selectedDay.data.historiques.length === 0 && (
                  <div className="alert alert-light text-muted">
                    Aucun appel ce jour
                    {hasActiveFilter && " (filtre actif)"}
                  </div>
                )}

                {selectedDay.data.historiques.map((h) => {
                  const sm = STATUS_LABEL[h.status] ?? {
                    label: "—",
                    cls: "bg-light text-dark",
                  };
                  const time = new Date(h.callDate).toLocaleTimeString(
                    "fr-FR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  );

                  return (
                    <div key={h._id} className="border rounded p-3 mb-2">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-bold">{h.calledNumber}</div>
                          <div className="small text-muted">
                            {h.aiResponse?.nameUser ?? "—"}
                          </div>
                          <div className="small text-muted mt-1">
                            {h.aiResponse?.description}
                          </div>
                          {/* Méta : heure + durée */}
                          <div className="d-flex gap-3 mt-2">
                            <span className="small text-muted">🕐 {time}</span>
                            {h.billsec !== undefined && (
                              <span className="small text-muted">
                                ⏱ {formatDuration(h.billsec)}
                              </span>
                            )}
                            {h.callerNumber && (
                              <span className="small text-muted">
                                📲 {h.callerNumber}
                              </span>
                            )}
                          </div>
                          {/* <div className="audio_calendrier">
                            {h.pathRecord && (
                              <div className="mt-2">
                                <div
                                  className="historiqueCol schedulerCol"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {buildRecordUrl(h.pathRecord) ? (
                                    <>
                                      <audio controls className="scheduler">
                                        <source
                                          src={buildRecordUrl(h.pathRecord)}
                                        />
                                        Votre navigateur ne supporte pas
                                        l'audio.
                                      </audio>
                                    </>
                                  ) : (
                                    <span className="historiqueNoAudio">
                                      <i className="bi bi-volume-mute" /> Pas
                                      d'audio
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div> */}
                        </div>
                        <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                          <span className={`badge ${sm.cls}`}>{sm.label}</span>
                          <span className="small text-muted">{time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* ── SECTION : Rappels planifiés ── */}
                <h6 className="fw-bold mt-4 mb-3 text-warning">
                  ⏰ Rappels planifiés ({selectedDay.data.scheduled.length})
                </h6>

                {selectedDay.data.scheduled.length === 0 && (
                  <div className="alert alert-light text-muted">
                    Aucun rappel ce jour
                    {hasActiveFilter && " (filtre actif)"}
                  </div>
                )}

                {selectedDay.data.scheduled.map((s) => {
                  const ssObj = SCHEDULED_STATUS[s.status] ?? {
                    label: s.status,
                    cls: "bg-secondary",
                  };
                  const recordUrl = buildRecordUrl(s.pathRecord); // 👈 calculé ici

                  return (
                    <div
                      key={s._id}
                      className="border rounded-4 p-3 mb-3 bg-white shadow-sm"
                    >
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                        {/* LEFT */}
                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div
                              className={`rounded-circle ${
                                REASON_COLOR[s.reason] ?? "bg-secondary"
                              }`}
                              style={{ width: 14, height: 14, minWidth: 14 }}
                            />
                            <h6 className="fw-bold mb-0">{s.calledNumber}</h6>
                          </div>

                          <div className="small text-muted mb-1">
                            <strong>Nom :</strong>{" "}
                            {s.aiResponse?.nameUser || "Inconnu"}
                          </div>
                          <div className="small text-muted mb-2">
                            {/* Mettre a la ligne le text si c'est trop long */}
                            <strong>Description :</strong>{" "}
                            <span
                              className="text-truncate d-inline-block"
                              style={{ maxWidth: "50%" }}
                            >
                              {s.aiResponse?.description || "—"}
                            </span>
                          </div>

                          <div className="d-flex flex-wrap gap-3 mt-2">
                            <div className="small text-muted">
                              🕐{" "}
                              {new Date(s.scheduledAt).toLocaleTimeString(
                                "fr-FR",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </div>
                            <div className="small text-muted">
                              📲 {s.callerNumber}
                            </div>
                          </div>

                          {/* ── AUDIO ── */}
                          {/* <div
                            className="mt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {recordUrl ? (
                              <audio controls className="shcedulerAudio w-100">
                                <source src={recordUrl} />
                                Votre navigateur ne supporte pas l'audio.
                              </audio>
                            ) : (
                              <span className="small text-muted fst-italic">
                                <i className="bi bi-volume-mute me-1" />
                                Pas d'enregistrement
                              </span>
                            )}
                          </div> */}
                        </div>

                        {/* RIGHT */}
                        <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
                          <span
                            className={`badge px-3 py-2 ${
                              REASON_COLOR[s.reason] ?? "bg-secondary"
                            } ${s.reason === "RAPPEL" ? "text-dark" : ""}`}
                          >
                            {REASON_LABEL[s.reason] ?? s.reason}
                          </span>
                          <span className={`badge px-3 py-2 ${ssObj.cls}`}>
                            {ssObj.label}
                          </span>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(s._id);
                            }}
                          >
                            🗑 Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
