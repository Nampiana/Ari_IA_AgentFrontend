import React, { useEffect, useMemo, useState, useCallback } from "react";
import HeaderBar from "../../components/agents/HeaderBar";
import useScheduledCall from "../../hooks/useScheduledCall";
import useHistoriqueIa from "../../hooks/useHistoriqueIa";
import useCrmLead from "../../hooks/useCrmLead";
import "../../assets/css/calendrierPage.css";
import { buildRecordUrl } from "../../utils/buildPathAudio";

// ─── Constantes ────────────────────────────────────────────────────────────────

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const SOURCE_DEFS = {
  1: { label: "Auto", color: "#6b7280", bg: "#f3f4f6", icon: "bi-robot" },
  2: {
    label: "Manuel",
    color: "#d97706",
    bg: "#fef3c7",
    icon: "bi-person-fill",
  },
  3: {
    label: "CRM",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: "bi-person-badge-fill",
  },
};

const getSourceDef = (source) => SOURCE_DEFS[source] || SOURCE_DEFS[1];

// Codes couleur CRM — alignés sur ceux déjà utilisés dans CrmKanbanPage
const CRM_STATUS_DEFS = {
  1: {
    label: "Confirmé",
    color: "#16a34a",
    bg: "#dcfce7",
    icon: "bi-check-circle-fill",
  },
  2: {
    label: "Non confirmé",
    color: "#6b7280",
    bg: "#f3f4f6",
    icon: "bi-x-circle-fill",
  },
  3: {
    label: "À relancer",
    color: "#2563eb",
    bg: "#dbeafe",
    icon: "bi-arrow-repeat",
  },
};

function mondayFirstIndex(date) {
  return (date.getDay() + 6) % 7;
}

function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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
  CALLBACK: "bg-warning",
  NI: "bg-danger",
  OCCUPE: "bg-gris",
  REPONDEUR: "bg-info",
  SALE: "bg-success",
  SVI:       "bg-cyan", 
};

const REASON_LABEL = {
  RAPPEL: "Rappel",
  CALLBACK: "Rappel",
  NI: "Non intéressé",
  OCCUPE: "Occupé",
  REPONDEUR: "Répondeur",
  SALE: "Vente / RDV",
  SVI:"SVI",
};
 6=SVI
const STATUS_LABEL = {
  1: { label: "Non intéressé", cls: "bg-danger", reason: "NI" },
  2: { label: "Vente / RDV", cls: "bg-success", reason: "SALE" },
  3: { label: "Rappel", cls: "bg-warning text-dark", reason: "RAPPEL" },
  4: { label: "Occupé", cls: "bg-gris", reason: "OCCUPE" },
  5: { label: "Répondeur", cls: "bg-info", reason: "REPONDEUR" },
  6: { label: "SVI", cls: "bg-cyan text-dark", reason: "SVI" },
  CALLBACK: { label: "Rappel", cls: "bg-warning text-dark", reason: "RAPPEL" },
};

const FILTER_CHIPS = [
  { key: "ALL", label: "Tous", cls: "btn-outline-secondary" },
  { key: "RAPPEL", label: "Rappel", cls: "btn-warning", dotCls: "bg-warning" },
  { key: "NI", label: "Non intéressé", cls: "btn-danger", dotCls: "bg-danger" },
  { key: "OCCUPE", label: "Occupé", cls: "btn-gris", dotCls: "bg-gris" },
  { key: "REPONDEUR", label: "Répondeur", cls: "btn-info", dotCls: "bg-info" },
  { key: "SVI", label: "SVI", cls: "btn-cyan", dotCls: "bg-cyan" },

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

// ── Composant carte unifié — même structure, couleurs différentes ──────────
const UnifiedCard = ({
  sourceBadge,
  accentColor,
  title,
  subtitle,
  description,
  metaItems,
  statusBadges,
  audioPath,
  actions,
}) => {
  const recordUrl = buildRecordUrl(audioPath);

  return (
    <div className="unifiedCard" style={{ borderLeftColor: accentColor }}>
      <div className="unifiedCardTop">
        <div className="unifiedCardLeft">
          <div className="unifiedCardBadgeRow">{sourceBadge}</div>
          <div className="unifiedCardTitle">{title}</div>
          {subtitle && <div className="unifiedCardSubtitle">{subtitle}</div>}
          {description && (
            <div className="unifiedCardDescription">{description}</div>
          )}
          {metaItems?.length > 0 && (
            <div className="unifiedCardMeta">
              {metaItems.map((m, i) => (
                <span key={i} className="unifiedCardMetaItem">
                  <i className={`bi ${m.icon}`} />
                  {m.text}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="unifiedCardRight">
          {statusBadges}
          {actions}
        </div>
      </div>

      {/* Audio toujours présent dans la même position pour tous les types */}
      <div className="unifiedCardAudio" onClick={(e) => e.stopPropagation()}>
        {recordUrl ? (
          <audio controls className="w-100" style={{ height: 34 }}>
            <source src={recordUrl} />
            Votre navigateur ne supporte pas l'audio.
          </audio>
        ) : (
          <span className="unifiedCardNoAudio">
            <i className="bi bi-volume-mute me-1" />
            Pas d'enregistrement
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Composant principal ───────────────────────────────────────────────────────

export default function CalendrierPage() {
  const { getScheduledCalls, deleteScheduledCall } = useScheduledCall();
  const { getHistoriques } = useHistoriqueIa();
  const { getCrmLeads } = useCrmLead();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledCalls, setScheduledCalls] = useState([]);
  const [historiques, setHistoriques] = useState([]);
  const [crmLeads, setCrmLeads] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [agentFilter, setAgentFilter] = useState("");
  const [campagneFilter, setCampagneFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scheduledRes, historiquesRes, crmLeadStatus1, crmLeadStatus2] =
        await Promise.all([
          getScheduledCalls(),
          [],
          getCrmLeads({ crmStatus: 1, isArchived: false }),
          getCrmLeads({ crmStatus: 2, isArchived: false }),
        ]);
      setScheduledCalls(scheduledRes?.data?.data || []);
      setHistoriques(historiquesRes?.data?.data || []);

      const confirmed = (crmLeadStatus1?.data?.data || []).filter(
        (l) => l.crmStatus == 1,
      );
      const nonConfirmed = (crmLeadStatus2?.data?.data || []).filter(
        (l) => l.crmStatus == 2,
      );

      // Un seul tableau global, distribué ensuite par crmStatus dans groupedData
      setCrmLeads([...confirmed, ...nonConfirmed]);
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
    setSourceFilter("ALL");
  };

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

  const matchesFilters = useCallback(
    (item, type) => {
      const q = searchQuery.trim().toLowerCase();

      if (q) {
        const num =
          type === "crm"
            ? (item.telephone || "").toLowerCase()
            : (item.calledNumber || "").toLowerCase();
        const name =
          type === "crm"
            ? (item.nom || "").toLowerCase()
            : (item.aiResponse?.nameUser || "").toLowerCase();
        if (!num.includes(q) && !name.includes(q)) return false;
      }

      if (statusFilter !== "ALL" && type !== "crm") {
        const reason =
          type === "historique"
            ? STATUS_LABEL[item.status]?.reason || ""
            : item.reason || "";
        if (reason !== statusFilter) return false;
      }

      if (agentFilter && type !== "crm") {
        const itemAgentId = item.agentIaId?._id || item.agentIaId;
        if (String(itemAgentId) !== agentFilter) return false;
      }

      if (campagneFilter) {
        const itemCampagneId = item.campagneId?._id || item.campagneId;
        if (String(itemCampagneId) !== campagneFilter) return false;
      }

      if (sourceFilter !== "ALL") {
        if (type === "historique") return false;
        const itemSource = type === "crm" ? 3 : item.source || 1;
        if (String(itemSource) !== String(sourceFilter)) return false;
      }

      return true;
    },
    [searchQuery, statusFilter, agentFilter, campagneFilter, sourceFilter],
  );

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

  // Les leads CRM sans callbackDate ne sont PAS groupés ici — section dédiée plus bas.
  const groupedData = useMemo(() => {
    const map = {};

    historiques
      .filter((h) => matchesFilters(h, "historique"))
      .forEach((h) => {
        if (!h.callDate) return;
        const key = toLocalDateKey(new Date(h.callDate));
        if (!map[key])
          map[key] = { historiques: [], scheduled: [], crmLeads: [] };
        map[key].historiques.push(h);
      });

    scheduledCalls
      .filter((s) => matchesFilters(s, "scheduled"))
      .forEach((s) => {
        if (!s.scheduledAt) return;
        const key = toLocalDateKey(new Date(s.scheduledAt));
        if (!map[key])
          map[key] = { historiques: [], scheduled: [], crmLeads: [] };
        map[key].scheduled.push(s);
      });

    // ── crmStatus 1 (Confirmé) → section CRM, peu importe la date ──────────────
    crmLeads
      .filter((l) => l.crmStatus === 1 && matchesFilters(l, "crm"))
      .forEach((l) => {        
        if (!l.historiqueId.callDate) return; // sans date → section dédiée plus bas
        const key = toLocalDateKey(new Date(l.historiqueId.callDate)); // ← corrigé
        if (!map[key])
          map[key] = { historiques: [], scheduled: [], crmLeads: [] };
        map[key].crmLeads.push(l);
      });

    // ── crmStatus 2 (Non confirmé) avec date → traité comme un rappel ──────────
    crmLeads
      .filter(
        (l) => l.crmStatus === 2 && l.callbackDate && matchesFilters(l, "crm"),
      )
      .forEach((l) => {
        const key = toLocalDateKey(new Date(l.callbackDate));
        if (!map[key])
          map[key] = { historiques: [], scheduled: [], crmLeads: [] };
        // Normalise le format pour ressembler à un ScheduledCall — réutilise UnifiedCard
        map[key].scheduled.push({
          _id: `crm-${l._id}`,
          _isCrmReminder: true, // marqueur pour distinguer dans le rendu
          _crmLead: l,
          calledNumber: l.telephone,
          callerNumber: l.historiqueId?.calledNumber || "—",
          scheduledAt: l.callbackDate,
          reason: "RAPPEL",
          status: "pending",
          source: 3,
          aiResponse: { nameUser: l.nom, description: l.note },
          _pathRecord: l.historiqueId?.pathRecord,
        });
      });
    return map;
  }, [historiques, scheduledCalls, crmLeads, matchesFilters]);

  // Leads CRM confirmés SANS callbackDate — section dédiée hors grille calendrier
  const crmLeadsWithoutDate = useMemo(
    () =>
      crmLeads.filter(
        (l) => l.crmStatus === 1 && matchesFilters(l, "crm") && !l.callbackDate,
      ),
    [crmLeads, matchesFilters],
  );

  const filteredTotal = useMemo(() => {
    const fH = historiques.filter((h) =>
      matchesFilters(h, "historique"),
    ).length;
    const fS = scheduledCalls.filter((s) =>
      matchesFilters(s, "scheduled"),
    ).length;
    const fC = crmLeads.filter((l) => matchesFilters(l, "crm")).length;
    return fH + fS + fC;
  }, [historiques, scheduledCalls, crmLeads, matchesFilters]);

  const hasActiveFilter =
    searchQuery.trim() !== "" ||
    statusFilter !== "ALL" ||
    agentFilter !== "" ||
    campagneFilter !== "" ||
    sourceFilter !== "ALL";

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce rappel planifié ?")) return;
    try {
      await deleteScheduledCall(id);
      setScheduledCalls((prev) => prev.filter((item) => item._id !== id));
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

  // Badge de source réutilisable — icône + couleur + libellé
  const renderSourceBadge = (source, size) => {
    const def = getSourceDef(source);
    return (
      <span
        className={`calSourceBadge ${size === "lg" ? "calSourceBadgeLg" : ""}`}
        style={{ color: def.color, background: def.bg }}
        title={`Source : ${def.label}`}
      >
        <i className={`bi ${def.icon} me-1`} />
        {def.label}
      </span>
    );
  };

  const renderCrmLeadItem = (lead) => (
    <div key={lead._id} className="calItem calItemCrm">
      {renderSourceBadge(3)}
      <span className="calItemPhone">{lead.telephone || "-"}</span>
      <span className="calItemReason">{lead.nom || "Lead confirmé"}</span>
    </div>
  );

  // Carte détaillée d'un lead CRM — section dédiée + modale jour
  const renderCrmLeadCard = (lead) => {
    const statusDef = CRM_STATUS_DEFS[lead.crmStatus] || CRM_STATUS_DEFS[1];
    const recordUrl = lead.historiqueId?.pathRecord
      ? buildRecordUrl(lead.historiqueId.pathRecord)
      : "";

    return (
      <div key={lead._id} className="crmLeadCard">
        <div className="crmLeadCardHeader">
          <div className="crmLeadCardIdentity">
            {renderSourceBadge(3)}
            <span
              className="crmLeadStatusDot"
              style={{ background: statusDef.color }}
              title={statusDef.label}
            />
            <strong className="crmLeadName">
              {lead.nom || "Lead sans nom"}
            </strong>
          </div>
          <span
            className="crmLeadStatusBadge"
            style={{ color: statusDef.color, background: statusDef.bg }}
          >
            <i className={`bi ${statusDef.icon} me-1`} />
            {statusDef.label}
          </span>
        </div>

        <div className="crmLeadCardBody">
          <div className="crmLeadCardRow">
            <i className="bi bi-telephone-fill" />
            {lead.telephone || "—"}
          </div>
          {lead.entreprise && (
            <div className="crmLeadCardRow">
              <i className="bi bi-building" />
              {lead.entreprise}
            </div>
          )}
          {lead.email && (
            <div className="crmLeadCardRow">
              <i className="bi bi-envelope-fill" />
              {lead.email}
            </div>
          )}
          <div className="crmLeadCardRow text-muted">
            <i className="bi bi-megaphone" />
            {lead.campagneId?.nomCompagne || "Campagne inconnue"}
          </div>

          {lead.note && <div className="crmLeadCardNote">{lead.note}</div>}

          {recordUrl && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <audio controls className="w-100" style={{ height: 32 }}>
                <source src={recordUrl} />
                Votre navigateur ne supporte pas l'audio.
              </audio>
            </div>
          )}
        </div>

        <div className="crmLeadCardFooter">
          <span>
            <i className="bi bi-calendar-event me-1" />
            {lead.historiqueId?.callDate
              ? new Date(lead.historiqueId.callDate).toLocaleDateString(
                  "fr-FR",
                  {
                    day: "numeric",
                    month: "short",
                  },
                )
              : "—"}
          </span>
          {lead.assignedTo && (
            <span className="crmLeadCardAssigned">{lead.assignedTo}</span>
          )}
        </div>
      </div>
    );
  };

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
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="ALL">Toutes les sources</option>
              <option value="1">Auto</option>
              <option value="2">Manuel</option>
              <option value="3">CRM</option>
            </select>

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
                    className={`rounded-circle ${statusFilter === key ? "bg-white" : dotCls}`}
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
            { cls: "bg-cyan", label: "SVI" },
          ].map(({ cls, label }) => (
            <div key={label} className="d-flex align-items-center gap-2">
              <span
                className={`rounded-circle ${cls}`}
                style={{ width: 12, height: 12, display: "inline-block" }}
              />
              <small className="text-muted">{label}</small>
            </div>
          ))}

          <div className="d-flex align-items-center gap-3 ms-md-auto">
            {Object.entries(SOURCE_DEFS).map(([key, def]) => (
              <div key={key} className="d-flex align-items-center gap-1">
                <i className={`bi ${def.icon}`} style={{ color: def.color }} />
                <small className="text-muted">{def.label}</small>
              </div>
            ))}
          </div>
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

        {loading && (
          <div className="alert alert-info">Chargement du calendrier…</div>
        )}

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
            const data = groupedData[key] || {
              historiques: [],
              scheduled: [],
              crmLeads: [],
            };
            const total =
              data.historiques.length +
              data.scheduled.length +
              data.crmLeads.length;
            const isToday = key === todayKey;
            const hasData = total > 0;

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
                    cursor: hasData ? "pointer" : "default",
                    outline: isToday ? "2px solid #0d6efd" : "none",
                    opacity: hasActiveFilter && !hasData ? 0.45 : 1,
                  }}
                  onClick={() => hasData && setSelectedDay({ date: key, data })}
                >
                  <div className="card-body p-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div
                        className={`fw-bold ${isToday ? "text-white bg-primary rounded-circle d-flex align-items-center justify-content-center" : ""}`}
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

                    {data.historiques.slice(0, 2).map((h) => {
                      const sm = STATUS_LABEL[h.status];
                      return (
                        <div
                          key={h._id}
                          className="d-flex align-items-center gap-1 mb-1"
                          style={{ fontSize: 11 }}
                        >
                          <span
                            className={`rounded-circle flex-shrink-0 ${sm?.cls?.split(" ")[0] || "bg-secondary"}`}
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

                    {data.scheduled.slice(0, 2).map((s) => (
                      <div
                        key={s._id}
                        className="d-flex align-items-center gap-1 mb-1"
                        style={{ fontSize: 11 }}
                      >
                        <i
                          className={`bi ${getSourceDef(s.source).icon}`}
                          style={{
                            color: getSourceDef(s.source).color,
                            fontSize: 9,
                          }}
                          title={getSourceDef(s.source).label}
                        />
                        <span
                          className={`rounded-circle flex-shrink-0 ${REASON_COLOR[s.reason] ?? "bg-secondary"}`}
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

                    {data.crmLeads.slice(0, 2).map((l) => (
                      <div
                        key={l._id}
                        className="d-flex align-items-center gap-1 mb-1"
                        style={{ fontSize: 11 }}
                      >
                        <i
                          className="bi bi-person-badge-fill"
                          style={{ color: "#7c3aed", fontSize: 9 }}
                          title="CRM"
                        />
                        <span
                          className="rounded-circle flex-shrink-0"
                          style={{
                            width: 8,
                            height: 8,
                            display: "inline-block",
                            background: "#16a34a",
                          }}
                        />
                        <span className="text-truncate text-muted">
                          {l.telephone}
                        </span>
                      </div>
                    ))}

                    {total > 6 && (
                      <div style={{ fontSize: 10 }} className="text-muted">
                        +{total - 6} autre{total - 6 > 1 ? "s" : ""}
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
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
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
                {/* ── HISTORIQUE APPELS ── */}
                <h6 className="fw-bold mb-3 text-primary">
                  📞 Historique appels ({selectedDay.data.historiques.length})
                </h6>

                {selectedDay.data.historiques.length === 0 && (
                  <div className="alert alert-light text-muted">
                    Aucun appel ce jour{hasActiveFilter && " (filtre actif)"}
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
                    <UnifiedCard
                      key={h._id}
                      sourceBadge={
                        <span
                          className="calSourceBadge"
                          style={{ color: "#1d4ed8", background: "#dbeafe" }}
                        >
                          <i className="bi bi-telephone-fill me-1" />
                          Appel réel
                        </span>
                      }
                      accentColor="#1d4ed8"
                      title={h.calledNumber}
                      subtitle={h.aiResponse?.nameUser || null}
                      description={h.aiResponse?.description}
                      metaItems={[
                        { icon: "bi-clock", text: time },
                        ...(h.billsec !== undefined
                          ? [
                              {
                                icon: "bi-stopwatch",
                                text: formatDuration(h.billsec),
                              },
                            ]
                          : []),
                        ...(h.callerNumber
                          ? [
                              {
                                icon: "bi-telephone-inbound",
                                text: h.callerNumber,
                              },
                            ]
                          : []),
                      ]}
                      statusBadges={
                        <span className={`badge ${sm.cls}`}>{sm.label}</span>
                      }
                      audioPath={h.pathRecord}
                    />
                  );
                })}

                {/* ── CRM CONFIRMÉS ── */}
                <h6 className="fw-bold mt-4 mb-3" style={{ color: "#7c3aed" }}>
                  <i className="bi bi-person-badge-fill me-1" />
                  Leads CRM confirmés ({selectedDay.data.crmLeads.length})
                </h6>

                {selectedDay.data.crmLeads.length === 0 && (
                  <div className="alert alert-light text-muted">
                    Aucun lead CRM ce jour{hasActiveFilter && " (filtre actif)"}
                  </div>
                )}

                {selectedDay.data.crmLeads.map((lead) => {
                  const statusDef =
                    CRM_STATUS_DEFS[lead.crmStatus] || CRM_STATUS_DEFS[1];

                  return (
                    <UnifiedCard
                      key={lead._id}
                      sourceBadge={renderSourceBadge(3)}
                      accentColor="#7c3aed"
                      title={lead.nom || "Lead sans nom"}
                      subtitle={lead.telephone}
                      description={lead.note || lead.entreprise}
                      metaItems={[
                        ...(lead.email
                          ? [{ icon: "bi-envelope-fill", text: lead.email }]
                          : []),
                        {
                          icon: "bi-megaphone",
                          text:
                            lead.campagneId?.nomCompagne || "Campagne inconnue",
                        },
                        ...(lead.assignedTo
                          ? [{ icon: "bi-person-check", text: lead.assignedTo }]
                          : []),
                      ]}
                      statusBadges={
                        <span
                          className="badge"
                          style={{
                            color: statusDef.color,
                            background: statusDef.bg,
                          }}
                        >
                          <i className={`bi ${statusDef.icon} me-1`} />
                          {statusDef.label}
                        </span>
                      }
                      audioPath={lead.historiqueId?.pathRecord}
                    />
                  );
                })}

                {/* ── RAPPELS PLANIFIÉS ── */}
                <h6 className="fw-bold mt-4 mb-3 text-warning d-flex align-items-center gap-2">
                  <i className="bi bi-telephone-outbound-fill" />
                  Rappels planifiés ({selectedDay.data.scheduled.length})
                </h6>

                {selectedDay.data.scheduled.length === 0 && (
                  <div className="alert alert-light text-muted">
                    Aucun rappel ce jour{hasActiveFilter && " (filtre actif)"}
                  </div>
                )}

                {selectedDay.data.scheduled.map((s) => {
                  const ssObj = SCHEDULED_STATUS[s.status] ?? {
                    label: s.status,
                    cls: "bg-secondary",
                  };
                  const time = new Date(s.scheduledAt).toLocaleTimeString(
                    "fr-FR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  );
                  const accent = getSourceDef(s.source).color;

                  return (
                    <UnifiedCard
                      key={s._id}
                      sourceBadge={renderSourceBadge(s.source)}
                      accentColor={accent}
                      title={s.calledNumber}
                      subtitle={s.aiResponse?.nameUser || "Inconnu"}
                      description={s.aiResponse?.description}
                      metaItems={[
                        { icon: "bi-clock", text: time },
                        { icon: "bi-telephone-inbound", text: s.callerNumber },
                      ]}
                      statusBadges={
                        <>
                          <span
                            className={`badge ${REASON_COLOR[s.reason] ?? "bg-secondary"} ${s.reason === "RAPPEL" ? "text-dark" : ""}`}
                          >
                            {REASON_LABEL[s.reason] ?? s.reason}
                          </span>
                          {!s._isCrmReminder && (
                            <span className={`badge ${ssObj.cls}`}>
                              {ssObj.label}
                            </span>
                          )}
                          {s._isCrmReminder && (
                            <span
                              className="badge"
                              style={{
                                background: "#f3f4f6",
                                color: "#6b7280",
                              }}
                            >
                              <i className="bi bi-x-circle me-1" />
                              Non confirmé
                            </span>
                          )}
                          {s.resultStatus && (
                            <span className="badge bg-light text-dark border">
                              <i className="bi bi-flag me-1" />
                              {REASON_LABEL[s.resultStatus] || s.resultStatus}
                            </span>
                          )}
                        </>
                      }
                      audioPath={s._pathRecord}
                      actions={
                        // Seuls les vrais ScheduledCall sont supprimables
                        !s._isCrmReminder && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(s._id);
                            }}
                          >
                            <i className="bi bi-trash3" />
                          </button>
                        )
                      }
                    />
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
