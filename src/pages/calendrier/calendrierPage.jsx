import React, { useEffect, useMemo, useState } from "react";
import HeaderBar from "../../components/agents/HeaderBar";
import useScheduledCall from "../../hooks/useScheduledCall";
import useHistoriqueIa from "../../hooks/useHistoriqueIa";
import "bootstrap/dist/css/bootstrap.min.css";

// Jours semaine FR — commence Lundi
const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/**
 * Convertit getDay() (0=Dim … 6=Sam) en index lundi-first (0=Lun … 6=Dim)
 * Exemple :  getDay()=0 (Dim) → 6   |   getDay()=1 (Lun) → 0
 */
function mondayFirstIndex(date) {
  return (date.getDay() + 6) % 7;
}

/**
 * Retourne "YYYY-MM-DD" dans le fuseau LOCAL (pas UTC)
 * → évite le décalage d'un jour dû à toISOString() qui est en UTC
 */
function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const REASON_COLOR = {
  CALLBACK: "bg-warning",
  NI:       "bg-danger",
  OCCUPE:   "bg-secondary",
  REPONDEUR:"bg-dark",
  SALE:     "bg-success",
};

const REASON_LABEL = {
  CALLBACK:  "Callback",
  NI:        "Non intéressé",
  OCCUPE:    "Occupé",
  REPONDEUR: "Répondeur",
  SALE:      "Vente / RDV",
};

const STATUS_LABEL = {
  1: { label: "NI",       cls: "bg-danger"    },
  2: { label: "Vente",    cls: "bg-success"   },
  3: { label: "Callback", cls: "bg-warning text-dark" },
  4: { label: "Occupé",   cls: "bg-secondary" },
};

export default function CalendrierPage() {
  const { getScheduledCalls } = useScheduledCall();
  const { getHistoriques }    = useHistoriqueIa();

  const [currentDate, setCurrentDate]    = useState(new Date());
  const [scheduledCalls, setScheduledCalls] = useState([]);
  const [historiques, setHistoriques]    = useState([]);
  const [selectedDay, setSelectedDay]    = useState(null);
  const [loading, setLoading]        = useState(false);

  // ── Chargement ────────────────────────────────────────────
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scheduledRes, historiquesRes] = await Promise.all([
        getScheduledCalls(),
        getHistoriques(),
      ]);      
      setScheduledCalls(scheduledRes?.data?.data || []);
    //   setHistoriques(historiquesRes?.data?.data || []);
      setHistoriques([]);
    } catch (err) {
      console.error("Erreur chargement calendrier:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Calcul du mois ────────────────────────────────────────
  const month = currentDate.getMonth();
  const year  = currentDate.getFullYear();

  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);

  // Nombre de cellules vides avant le 1er (semaine lundi-first)
  const startOffset = mondayFirstIndex(firstDay);
  const totalDays   = lastDay.getDate();

  // Tableau de cellules : null = vide, sinon objet Date du jour
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));

  const monthLabel = currentDate.toLocaleDateString("fr-FR", {
    month: "long",
    year:  "numeric",
  });

  const todayKey = toLocalDateKey(new Date());

  // ── Groupement par date locale ────────────────────────────
  const groupedData = useMemo(() => {
    const map = {};

    historiques.forEach((h) => {
      if (!h.callDate) return;
      const key = toLocalDateKey(new Date(h.callDate));
      if (!map[key]) map[key] = { historiques: [], scheduled: [] };
      map[key].historiques.push(h);
    });

    scheduledCalls.forEach((s) => {
      if (!s.scheduledAt) return;
      const key = toLocalDateKey(new Date(s.scheduledAt));
      if (!map[key]) map[key] = { historiques: [], scheduled: [] };
      map[key].scheduled.push(s);
    });    
    return map;
  }, [historiques, scheduledCalls]);

  // ── Navigation ────────────────────────────────────────────
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday   = () => setCurrentDate(new Date());

  // ── Rendu ─────────────────────────────────────────────────
  return (
    <div className="CalendrierPage bg-light min-vh-100">
      <HeaderBar />

      <div className="container-fluid py-4">

        {/* HEADER NAVIGATION */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button className="btn btn-outline-primary" onClick={prevMonth}>←</button>

          <div className="d-flex align-items-center gap-3">
            <h3 className="fw-bold text-capitalize m-0">{monthLabel}</h3>
            <button className="btn btn-sm btn-outline-secondary" onClick={goToday}>
              Aujourd'hui
            </button>
          </div>

          <button className="btn btn-outline-primary" onClick={nextMonth}>→</button>
        </div>

        {/* LOADING */}
        {loading && <div className="alert alert-info">Chargement du calendrier...</div>}

        {/* LÉGENDE */}
        <div className="d-flex flex-wrap gap-4 mb-4">
          {[
            { cls: "bg-primary",    label: "Historique appels" },
            { cls: "bg-warning",    label: "Callback" },
            { cls: "bg-danger",     label: "Non intéressé" },
            { cls: "bg-secondary",  label: "Occupé / Répondeur" },
            { cls: "bg-success",    label: "RDV / Vente" },
          ].map(({ cls, label }) => (
            <div key={label} className="d-flex align-items-center gap-2">
              <span className={`rounded-circle ${cls}`} style={{ width: 12, height: 12, display: "inline-block" }} />
              <small>{label}</small>
            </div>
          ))}
        </div>

        {/* EN-TÊTES JOURS — Lun à Dim */}
        <div className="row g-1 mb-1 text-center fw-bold text-muted small">
          {WEEK_DAYS.map((d) => (
            <div className="col" key={d} style={{ minWidth: "14.2%", maxWidth: "14.2%" }}>
              {d}
            </div>
          ))}
        </div>

        {/* GRILLE CALENDRIER */}
        <div className="row g-1">
          {cells.map((day, index) => {

            // Cellule vide
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="col"
                  style={{ minWidth: "14.2%", maxWidth: "14.2%", minHeight: 120 }}
                />
              );
            }

            const key      = toLocalDateKey(day);
            const data     = groupedData[key] || { historiques: [], scheduled: [] };
            const total    = data.historiques.length + data.scheduled.length;
            const isToday  = key === todayKey;

            return (
              <div
                key={key}
                className="col"
                style={{ minWidth: "14.2%", maxWidth: "14.2%" }}
              >
                <div
                  className={`card border-0 shadow-sm h-100 ${isToday ? "border border-primary border-2" : ""}`}
                  style={{
                    minHeight: 120,
                    cursor: "pointer",
                    outline: isToday ? "2px solid #0d6efd" : "none",
                  }}
                  onClick={() => setSelectedDay({ date: key, data })}
                >
                  <div className="card-body p-2">

                    {/* Numéro du jour */}
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div
                        className={`fw-bold ${isToday ? "text-white bg-primary rounded-circle d-flex align-items-center justify-content-center" : ""}`}
                        style={isToday ? { width: 26, height: 26, fontSize: 13 } : {}}
                      >
                        {day.getDate()}
                      </div>
                      {total > 0 && (
                        <span className="badge bg-dark" style={{ fontSize: 10 }}>{total}</span>
                      )}
                    </div>

                    {/* Historiques (pastille bleue) */}
                    {data.historiques.slice(0, 2).map((h) => (
                      <div key={h._id} className="d-flex align-items-center gap-1 mb-1" style={{ fontSize: 11 }}>
                        <span className="bg-primary rounded-circle flex-shrink-0" style={{ width: 8, height: 8, display: "inline-block" }} />
                        <span className="text-truncate text-muted">{h.calledNumber}</span>
                      </div>
                    ))}

                    {/* Rappels planifiés */}
                    {data.scheduled.slice(0, 2).map((s) => (
                      <div key={s._id} className="d-flex align-items-center gap-1 mb-1" style={{ fontSize: 11 }}>
                        <span
                          className={`rounded-circle flex-shrink-0 ${REASON_COLOR[s.reason] ?? "bg-secondary"}`}
                          style={{ width: 8, height: 8, display: "inline-block" }}
                        />
                        <span className="text-truncate text-muted">{s.calledNumber}</span>
                      </div>
                    ))}

                    {/* "+N autres" */}
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

      {/* MODAL DÉTAIL DU JOUR */}
      {selectedDay && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedDay(null); }}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">

              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  📅 {new Date(selectedDay.date + "T12:00:00").toLocaleDateString("fr-FR", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </h5>
                <button className="btn-close" onClick={() => setSelectedDay(null)} />
              </div>

              <div className="modal-body">

                {/* Historique appels */}
                <h6 className="fw-bold mb-3 text-primary">
                  📞 Historique appels ({selectedDay.data.historiques.length})
                </h6>

                {selectedDay.data.historiques.length === 0 && (
                  <div className="alert alert-light text-muted">Aucun appel ce jour</div>
                )}

                {selectedDay.data.historiques.map((h) => {
                  const s = STATUS_LABEL[h.status] ?? { label: "—", cls: "bg-light text-dark" };
                  return (
                    <div key={h._id} className="border rounded p-3 mb-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-bold">{h.calledNumber}</div>
                          <div className="small text-muted">{h.aiResponse?.nameUser ?? "—"}</div>
                          <div className="small text-muted mt-1">{h.aiResponse?.description}</div>
                        </div>
                        <div className="d-flex flex-column align-items-end gap-1">
                          <span className={`badge ${s.cls}`}>{s.label}</span>
                          <span className="small text-muted">
                            {new Date(h.callDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Rappels planifiés */}
                <h6 className="fw-bold mt-4 mb-3 text-warning">
                  ⏰ Rappels planifiés ({selectedDay.data.scheduled.length})
                </h6>

                {selectedDay.data.scheduled.length === 0 && (
                  <div className="alert alert-light text-muted">Aucun rappel ce jour</div>
                )}

                {selectedDay.data.scheduled.map((s) => (
                  <div key={s._id} className="border rounded p-3 mb-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-bold">{s.calledNumber}</div>
                        <div className="small text-muted">{s.aiResponse?.nameUser ?? "—"}</div>
                        <div className="small text-muted mt-1">{s.aiResponse?.description ?? s.notes}</div>
                        <div className="mt-2 d-flex gap-2 flex-wrap">
                          <span className="small text-muted">Retry : {s.retryCount}</span>
                          <span className="small text-muted">|</span>
                          <span className={`badge small ${s.status === "pending" ? "bg-warning text-dark" : s.status === "done" ? "bg-success" : s.status === "running" ? "bg-info" : "bg-danger"}`}>
                            {s.status}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        <span className={`badge ${REASON_COLOR[s.reason] ?? "bg-secondary"} ${s.reason === "CALLBACK" ? "text-dark" : ""}`}>
                          {REASON_LABEL[s.reason] ?? s.reason}
                        </span>
                        <span className="small text-muted">
                          {new Date(s.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
