import React, { useEffect, useMemo, useState } from "react";
import HeaderBar from "../../components/agents/HeaderBar";
import useHistoriqueIa from "../../hooks/useHistoriqueIa";
import useCompagne from "../../hooks/useCompagne";
import useAgent from "../../hooks/useAgent";
import HistoriqueDetailModal from "../../components/historique/HistoriqueDetailModal.jsx";
import StatusDropdown from "../../components/historique/StatusDropdown.jsx";
import { getStatusLabel } from "../../utils/statusUtils.js";
import ScheduledCallsDrawer from "../../components/historique/ScheduledCallsDrawer.jsx";
import EmailSentModal from "../../components/historique/Emailsentmodal.jsx";
import "../../assets/css/HistoriquesPage.css";

const ITEMS_PER_PAGE = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

const getTodayDateInputValue = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return (
    d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      timeZone: "Europe/Paris", // ✅
    }) +
    " " +
    d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris", // ✅
    })
  );
};
const formatDuration = (seconds) => {
  const sec = Number(seconds || 0);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

const formatTotalDuration = (seconds) => {
  const sec = Math.floor(Number(seconds || 0));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const remainingSeconds = sec % 60;
  if (hours > 0)
    return `${hours} h ${String(minutes).padStart(2, "0")} min ${String(remainingSeconds).padStart(2, "0")} s`;
  return `${minutes} min ${String(remainingSeconds).padStart(2, "0")} s`;
};

const formatTelecomCost = (cost) => {
  const value = Number(cost || 0);
  return `${value.toFixed(4).replace(".", ",")} €`;
};

const buildRecordUrl = (pathRecord) => {
  if (!pathRecord) return "";
  if (pathRecord.startsWith("http://") || pathRecord.startsWith("https://"))
    return pathRecord;
  const base = (
    process.env.REACT_APP_HOST_API || "http://localhost:4000/api/v1/"
  )
    .replace("/api/v1/", "")
    .replace(/\/$/, "");
  return `${base}/files/${pathRecord}`;
};

const hasActiveFilters = (
  search,
  selectedStatus,
  selectedCampagne,
  selectedAgentIa,
  dateStart,
  dateEnd,
  filtersArchive,
  selectedTypeCall,
  timeStart,
  timeEnd,
) =>
  search.trim() !== "" ||
  selectedStatus !== "all" ||
  selectedCampagne !== "all" ||
  selectedAgentIa !== "all" ||
  dateStart !== "" ||
  dateEnd !== "" ||
  filtersArchive !== "all" ||
  selectedTypeCall !== "all" ||
  timeStart !== "" ||
  timeEnd !== "";

// ── Qualifications ────────────────────────────────────────────────────────────
// Après la définition de status "1" (Pas intéressé) :
const STATUS_DEFS = [
  {
    key: "2",
    label: "Réussi",
    color: "#16a34a",
    bg: "#dcfce7",
    icon: "bi-check-circle-fill",
  },
  {
    key: "3",
    label: "Rappel",
    color: "#2563eb",
    bg: "#dbeafe",
    icon: "bi-arrow-repeat",
  },
  {
    key: "4",
    label: "Occupé",
    color: "#d97706",
    bg: "#fef3c7",
    icon: "bi-telephone-x-fill",
  },
  {
    key: "5",
    label: "Répondeur",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: "bi-voicemail",
  },
  {
    key: "1",
    label: "Pas intéressé",
    color: "#6b7280",
    bg: "#f3f4f6",
    icon: "bi-x-circle-fill",
  },
  {
    key: "6",
    label: "SVI",
    color: "#0891b2",
    bg: "#cffafe",
    icon: "bi-telephone-inbound-fill",
  }, // ← nouveau
  {
    key: "7",
    label: "AMD Répondeur",
    color: "#0891b2",
    bg: "rgb(224 224 224)",
    icon: "bi-telephone-inbound-fill",
  },
];

// ── Normalise statusCounts — clés peuvent venir en number ou string ───────────
// ⚡ FIX bug badges invisibles : on force toutes les clés en string
const normalizeStatusCounts = (raw = {}) => {
  const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  Object.entries(raw).forEach(([k, v]) => {
    result[String(k)] = Number(v) || 0;
  });
  return result;
};

// ── Badge qualification cliquable ─────────────────────────────────────────────
function StatusCountBadge({ def, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Filtrer : ${def.label}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "20px",
        border: `1.5px solid ${active ? def.color : "transparent"}`,
        background: def.bg,
        color: def.color,
        fontWeight: active ? 700 : 500,
        fontSize: "0.78rem",
        cursor: "pointer",
        transition: "border-color 0.15s",
        whiteSpace: "nowrap",
        boxShadow: active ? `0 0 0 2px ${def.color}33` : "none",
      }}
    >
      <i className={`bi ${def.icon}`} style={{ fontSize: "0.8rem" }} />
      <span>{def.label}</span>
      <span
        style={{
          background: active ? def.color : "#e5e7eb",
          color: active ? "#fff" : "#374151",
          borderRadius: "10px",
          padding: "1px 7px",
          fontWeight: 700,
          fontSize: "0.75rem",
          minWidth: "22px",
          textAlign: "center",
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function HistoriquesPage({ showToast }) {
  const { getHistoriques, archiveManyHistoriques, updateHistorique, toggleArchiveManyHistoriques } =
    useHistoriqueIa();

  const [historiques, setHistoriques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCampagne, setSelectedCampagne] = useState("all");
  const [dateStart, setDateStart] = useState(getTodayDateInputValue);
  const [dateEnd, setDateEnd] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [selectedHistorique, setSelectedHistorique] = useState(null);
  const [selectedAgentIa, setSelectedAgentIa] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersArchive, setFiltersArchive] = useState("all");
  const [agentIas, setAgentIas] = useState([]);
  const [campagnes, setCampagnes] = useState([]);
  const [pendingStatus, setPendingStatus] = useState({});
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [totalCallDuration, setTotalCallDuration] = useState(0);
  const [totalTelecomCost, setTotalTelecomCost] = useState(0);
  const [drawerHistorique, setDrawerHistorique] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedTypeCall, setSelectedTypeCall] = useState("all");
  const [confirmArchive, setConfirmArchive] = useState(null);
  const [emailModalHistorique, setEmailModalHistorique] = useState(null);

  // ⚡ Tri — "date_desc" par défaut (comportement original)
  // Valeurs : "date_desc" | "date_asc" | "duration_desc" | "duration_asc"
  const [sortOrder, setSortOrder] = useState("date_desc");
  const [showEmailColumn, setShowEmailColumn] = useState(true);

  // ⚡ statusCounts — toutes clés string dès l'init
  const [statusCounts, setStatusCounts] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
  });

  const { getAgents } = useAgent();
  const { getCompagnes } = useCompagne();

  // Convertit sortOrder en paramètre backend
  const sortParam = () => {
    switch (sortOrder) {
      case "date_asc":
        return "callDate";
      case "duration_desc":
        return "-callDuration";
      case "duration_asc":
        return "callDuration";
      default:
        return "-callDate"; // date_desc
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStatusChange = async (id, newStatus) => {
    setPendingStatus((prev) => ({ ...prev, [id]: newStatus }));
    await updateHistorique(id, { status: newStatus });
    showToast?.("Statut mis à jour", "success");
  };

  const toggleSelectOne = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleStatusBadgeClick = (key) => {
    setSelectedStatus((prev) => (prev === key ? "all" : key));
    setCurrentPage(1);
  };

  // ── Chargement initial des listes ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setAgentIas((await getAgents())?.data?.data || []);
      } catch {
        showToast?.("Erreur chargement agents IA", "danger");
      }
    })();
    (async () => {
      try {
        setCampagnes((await getCompagnes())?.data?.data || []);
      } catch {
        showToast?.("Erreur chargement campagnes", "danger");
      }
    })();
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [
    currentPage,
    search,
    selectedStatus,
    selectedCampagne,
    selectedAgentIa,
    dateStart,
    dateEnd,
    timeStart,
    timeEnd,
    filtersArchive,
    selectedTypeCall,
  ]);

  // ── Fetch historiques ──────────────────────────────────────────────────────
  const fetchHistoriques = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: ITEMS_PER_PAGE, sort: sortParam() };

      if (search.trim()) params.search = search.trim();
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (selectedCampagne !== "all") params.campagneId = selectedCampagne;
      if (selectedAgentIa !== "all") params.agentIaId = selectedAgentIa;
      if (dateStart) params.dateStart = dateStart;
      if (dateEnd) params.dateEnd = dateEnd;
      if (filtersArchive !== "all") params.archive = filtersArchive;
      if (selectedTypeCall !== "all") params.typeCall = selectedTypeCall;
      if (timeStart) params.timeStart = timeStart; // heure France brute → back gère la conversion
      if (timeEnd) params.timeEnd = timeEnd;

      const res = await getHistoriques(params);
      setHistoriques(res?.data?.data || []);
      setTotalPages(res?.data?.totalPages || 1);
      setTotalResults(res?.data?.totalResults || 0);
      setTotalCallDuration(res?.data?.totalDuration ?? 0);
      setTotalTelecomCost(res?.data?.totalTelecomCost ?? 0);
      // ⚡ FIX : normaliser les clés avant de stocker
      setStatusCounts(normalizeStatusCounts(res?.data?.statusCounts));
    } catch {
      showToast?.("Erreur chargement historiques", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchHistoriques(currentPage);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchHistoriques(currentPage);
  }, [
    currentPage,
    search,
    selectedStatus,
    selectedCampagne,
    selectedAgentIa,
    dateStart,
    dateEnd,
    timeStart,
    timeEnd,
    filtersArchive,
    selectedTypeCall,
    sortOrder,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    selectedStatus,
    selectedCampagne,
    selectedAgentIa,
    dateStart,
    dateEnd,
    timeStart,
    timeEnd,
    filtersArchive,
    selectedTypeCall,
  ]);

  // ── Sélection ─────────────────────────────────────────────────────────────
  const pageIds = useMemo(
    () => historiques?.map((i) => i._id) ?? [],
    [historiques],
  );
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected =
    !allPageSelected && pageIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const n = new Set(prev);
        pageIds.forEach((id) => n.delete(id));
        return n;
      });
    } else {
      setSelectedIds((prev) => {
        const n = new Set(prev);
        pageIds.forEach((id) => n.add(id));
        return n;
      });
    }
  };

  const handleArchiveSelected = async () => {
    const ids =
      selectedIds.size > 0 ? [...selectedIds] : historiques.map((i) => i._id);
    if (!ids.length)
      return showToast?.("Aucun historique à archiver", "warning");
    try {
      await archiveManyHistoriques(ids);
      showToast?.(
        selectedIds.size > 0
          ? `${ids.length} historique(s) archivé(s)`
          : "Page archivée",
        "success",
      );
      setSelectedIds(new Set());
      fetchHistoriques(currentPage);
    } catch {
      showToast?.("Erreur lors de l'archivage", "danger");
    }
  };

  const handleToggleArchiveSelected = async (archive) => {
    const ids =
      selectedIds.size > 0 ? [...selectedIds] : historiques.map((i) => i._id);
    if (!ids.length)
      return showToast?.("Aucun historique sélectionné", "warning");
    try {
      await toggleArchiveManyHistoriques(ids, archive);
      showToast?.(
        selectedIds.size > 0
          ? `${ids.length} historique(s) ${archive ? "archivé(s)" : "désarchivé(s)"}`
          : `Page ${archive ? "archivée" : "désarchivée"}`,
        "success",
      );
      setSelectedIds(new Set());
      setConfirmArchive(null);
      fetchHistoriques(currentPage);
    } catch (err) {
      console.log(err);

      showToast?.(
        `Erreur lors de l'${archive ? "archivage" : "désarchivage"}`,
        "danger",
      );
      setConfirmArchive(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedStatus("all");
    setSelectedCampagne("all");
    setSelectedAgentIa("all");
    setDateStart(getTodayDateInputValue());
    setDateEnd("");
    setTimeStart("");
    setTimeEnd("");
    setFiltersArchive("all");
    setSortOrder("date_desc");
    setSelectedTypeCall("all");
  };

  // ── Helpers UI ─────────────────────────────────────────────────────────────
  const filtersActive =
    hasActiveFilters(
      search,
      selectedStatus,
      selectedCampagne,
      selectedAgentIa,
      dateStart,
      dateEnd,
      filtersArchive,
      selectedTypeCall,
      timeStart,
      timeEnd,
    ) || sortOrder !== "date_desc";

  const getDurationValue = (item) =>
    Number(item?.callDuration ?? item?.billsec ?? 0);

  const agentsIaOptions = useMemo(() => {
    const map = new Map();
    historiques.forEach((item) => {
      const a = item?.agentIaId;
      if (a?._id)
        map.set(a._id, { _id: a._id, nomAgent: a.nomAgent || "Sans nom" });
    });
    return Array.from(map.values());
  }, [historiques]);

  const getCounterLabel = () => {
    const count = totalResults;
    if (!filtersActive)
      return `${count} appel${count !== 1 ? "s" : ""} au total`;
    const parts = [];
    if (selectedCampagne !== "all") {
      const c = campagnes.find((x) => x._id === selectedCampagne);
      if (c) parts.push(c.nomCompagne);
    }
    if (selectedAgentIa !== "all") {
      const a = agentsIaOptions.find((x) => x._id === selectedAgentIa);
      if (a) parts.push(a.nomAgent);
    }
    if (selectedStatus !== "all") parts.push(getStatusLabel(selectedStatus));
    const suffix = parts.length ? ` — ${parts.join(", ")}` : "";
    return `${count} appel${count !== 1 ? "s" : ""} trouvé${count !== 1 ? "s" : ""}${suffix}`;
  };

  const getPageNumbers = () => {
    const pages = [],
      delta = 2;
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);
    if (left > 1) {
      pages.push(1);
      if (left > 2) pages.push("...");
    }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) {
      if (right < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // Libellé et icône du tri actuel pour affichage dans le header de colonne
  const sortMeta = {
    date_desc: { label: "Date ↓", icon: "bi-calendar-arrow-down", col: "date" },
    date_asc: { label: "Date ↑", icon: "bi-calendar-arrow-up", col: "date" },
    duration_desc: {
      label: "Durée ↓",
      icon: "bi-sort-numeric-down-alt",
      col: "duration",
    },
    duration_asc: {
      label: "Durée ↑",
      icon: "bi-sort-numeric-down",
      col: "duration",
    },
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div className="historiquesPage">
      <HeaderBar />

      <div className="historiquesContainer">
        <div className="historiquesCard">
          {/* ── En-tête ── */}
          <div className="historiquesHeader">
            <div>
              <h1>Journal des appels</h1>
              <p>Consultez l'historique détaillé des appels IA.</p>

              <div className="historiquesCounter">
                <i className="bi bi-telephone-fill" />
                <span>{getCounterLabel()}</span>
              </div>
              <div className="historiquesCounter">
                <i className="bi bi-clock-history" />
                <span>
                  Durée totale : {formatTotalDuration(totalCallDuration)}
                </span>
              </div>
              <div className="historiquesCounter">
                <i className="bi bi-cash-coin" />
                <span>
                  Coût télécom estimé : {formatTelecomCost(totalTelecomCost)}
                </span>
              </div>

              {/* ⚡ Badges qualification avec comptages ── */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginTop: "10px",
                }}
              >
                {STATUS_DEFS.map((def) => (
                  <StatusCountBadge
                    key={def.key}
                    def={def}
                    count={statusCounts[def.key] ?? 0}
                    active={selectedStatus === def.key}
                    onClick={() => handleStatusBadgeClick(def.key)}
                  />
                ))}
              </div>
            </div>

            {/* ── Contrôles ── */}
            <div className="historiquesActions">
              {/* Rangée 1 : Recherche + boutons */}
              <div className="historiquesActionsRow historiquesActionsRow--top">
                <div className="historiquesSearch">
                  <i className="bi bi-search" />
                  <input
                    type="text"
                    placeholder="Rechercher un numéro, canal…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="historiquesActionsGroup">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    title="Rafraîchir la liste"
                  >
                    <i
                      className={`bi bi-arrow-clockwise ${isRefreshing ? "spin" : ""}`}
                    />
                    {isRefreshing ? "Actualisation…" : "Actualiser"}
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      className={`btn btn-sm ${filtersArchive === "1" ? "btn-outline-secondary" : "btn-outline-primary"}`}
                      onClick={() =>
                        setConfirmArchive(filtersArchive === "1" ? 2 : 1)
                      }
                    >
                      <i className="bi bi-archive" />
                      {filtersArchive === "1"
                        ? `Désarchiver (${selectedIds.size})`
                        : `Archiver (${selectedIds.size})`}
                    </button>
                  )}

                  {filtersActive && (
                    <button
                      type="button"
                      className="historiquesResetBtn"
                      onClick={resetFilters}
                      title="Réinitialiser tous les filtres"
                    >
                      <i className="bi bi-x-circle" /> Réinitialiser
                    </button>
                  )}
                </div>
              </div>

              {/* Rangée 2 : Filtres + tri */}
              <div className="historiquesActionsRow historiquesActionsRow--filters">
                {/* Statut & Archive */}
                <div className="historiquesFilterGroup">
                  <span className="historiquesFilterLabel">
                    <i className="bi bi-funnel" /> Filtres
                  </span>
                  <select
                    className="historiquesFilterSelect"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="2">RÉUSSI</option>
                    <option value="3">RAPPEL</option>
                    <option value="4">OCCUPÉ</option>
                    <option value="5">RÉPONDEUR</option>
                    <option value="1">PAS INTÉRESSÉ</option>
                    <option value="6">SVI</option>
                    <option value="7">AMD Répondeur</option>
                  </select>
                  <select
                    className="historiquesFilterSelect"
                    value={filtersArchive}
                    onChange={(e) => setFiltersArchive(e.target.value)}
                  >
                    <option value="all">Tous (archivés)</option>
                    <option value="1">Archivés</option>
                    <option value="2">Non archivés</option>
                  </select>

                  <select
                    className="historiquesFilterSelect"
                    value={selectedTypeCall}
                    onChange={(e) => {
                      setSelectedTypeCall(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">Tous les appels</option>
                    <option value="1">Appels sortants</option>
                    <option value="2">Appels entrants</option>
                  </select>
                </div>

                <div className="historiquesFilterDivider" />

                {/* Campagne & Agent */}
                <div className="historiquesFilterGroup">
                  <span className="historiquesFilterLabel">
                    <i className="bi bi-diagram-3" /> Source
                  </span>
                  <select
                    className="historiquesFilterSelect"
                    value={selectedCampagne}
                    onChange={(e) => setSelectedCampagne(e.target.value)}
                  >
                    <option value="all">Toutes les campagnes</option>
                    {campagnes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.nomCompagne}
                      </option>
                    ))}
                  </select>
                  <select
                    className="historiquesFilterSelect"
                    value={selectedAgentIa}
                    onChange={(e) => setSelectedAgentIa(e.target.value)}
                  >
                    <option value="all">Tous les agents IA</option>
                    {agentIas.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.nomAgent}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="historiquesFilterDivider" />

                {/* Dates */}
                <div className="historiquesFilterGroup">
                  <span className="historiquesFilterLabel">
                    <i className="bi bi-calendar-range" /> Période
                  </span>
                  <div className="historiquesDateFilter">
                    <input
                      type="date"
                      className="historiquesDateInput"
                      value={dateStart}
                      onChange={(e) => {
                        const newDateStart = e.target.value;
                        setDateStart(newDateStart);

                        if (dateEnd && dateEnd < newDateStart) {
                          setDateEnd("");
                        }

                        setCurrentPage(1);
                      }}
                    />

                    <span className="historiquesDateSeparator">→</span>

                    <input
                      type="date"
                      className="historiquesDateInput"
                      value={dateEnd}
                      min={dateStart}
                      onChange={(e) => {
                        setDateEnd(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="historiquesFilterDivider" />

                {/* Heures */}
                <div className="historiquesFilterGroup">
                  <span className="historiquesFilterLabel">
                    <i className="bi bi-clock" /> Heure
                  </span>
                  <div className="historiquesDateFilter">
                    <input
                      type="time"
                      className="historiquesTimeInput"
                      value={timeStart}
                      onChange={(e) => setTimeStart(e.target.value)}
                      placeholder="00:00"
                    />
                    <span className="historiquesDateSeparator">→</span>
                    <input
                      type="time"
                      className="historiquesTimeInput"
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(e.target.value)}
                      placeholder="23:59"
                    />
                  </div>
                </div>

                <div className="historiquesFilterDivider" />

                {/* ⚡ Tri — select explicite visible dans la barre de filtres */}
                <div className="historiquesFilterGroup">
                  <span className="historiquesFilterLabel">
                    <i className="bi bi-arrow-down-up" /> Trier
                  </span>
                  <select
                    className="historiquesFilterSelect"
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      fontWeight: sortOrder !== "date_desc" ? 600 : 400,
                      color: sortOrder !== "date_desc" ? "#2563eb" : undefined,
                    }}
                  >
                    <option value="date_desc">Date (plus récent)</option>
                    <option value="date_asc">Date (plus ancien)</option>
                    <option value="duration_desc">Durée (plus longue)</option>
                    <option value="duration_asc">Durée (plus courte)</option>
                  </select>
                </div>
                <div className="historiquesFilterDivider" />

              {/* ── Visibilité colonne Email ── */}
              <div className="historiquesFilterGroup">
                <span className="historiquesFilterLabel">
                  <i className="bi bi-envelope" /> Email
                </span>
                <select
                  className="historiquesFilterSelect"
                  value={showEmailColumn ? "show" : "hide"}
                  onChange={(e) => setShowEmailColumn(e.target.value === "show")}
                >
                  <option value="show">Afficher email</option>
                  <option value="hide">Masquer email</option>
                </select>
              </div>
              </div>
            </div>
          </div>

          {/* ── Corps ── */}
          {loading ? (
            <div className="historiquesEmpty">
              Chargement des historiques...
            </div>
          ) : historiques.length === 0 ? (
            <div className="historiquesEmpty">Aucun historique trouvé.</div>
          ) : (
            <>
              {/* Barre de sélection */}
              <div className="historiquesSelectBar">
                <label
                  className="historiquesSelectAllLabel"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className="historiquesCheckbox"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected;
                    }}
                    onChange={toggleSelectAll}
                  />
                  <span>
                    {allPageSelected
                      ? "Tout désélectionner"
                      : somePageSelected
                        ? `${[...selectedIds].filter((id) => pageIds.includes(id)).length} sélectionné(s)`
                        : "Tout sélectionner la page"}
                  </span>
                </label>
                {selectedIds.size > 0 && (
                  <span className="historiquesSelectionCount">
                    <i className="bi bi-check2-square" />
                    {selectedIds.size} élément{selectedIds.size > 1 ? "s" : ""}{" "}
                    sélectionné{selectedIds.size > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Tableau */}
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={
                            historiques.length > 0 &&
                            historiques.every((i) => selectedIds.has(i._id))
                          }
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th>Numéro appelé</th>
                      <th>Campagne</th>
                      <th>Agent IA</th>

                      {/* ⚡ En-tête Date — cliquable pour basculer asc/desc */}
                      <th>
                        Date
                        {/* <button
                          type="button"
                          onClick={() => {
                            setSortOrder((p) =>
                              p === "date_desc" ? "date_asc" : "date_desc",
                            );
                            setCurrentPage(1);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontWeight:
                              sortMeta[sortOrder].col === "date" ? 700 : 400,
                            color:
                              sortMeta[sortOrder].col === "date"
                                ? "#2563eb"
                                : "inherit",
                            fontSize: "inherit",
                          }}
                        >
                          Date
                          <i
                            className={`bi ${
                              sortOrder === "date_asc"
                                ? "bi-arrow-up"
                                : sortOrder === "date_desc"
                                  ? "bi-arrow-down"
                                  : "bi-arrow-down"
                            }`}
                            style={{
                              fontSize: "0.8rem",
                              opacity:
                                sortMeta[sortOrder].col === "date" ? 1 : 0.3,
                              color:
                                sortMeta[sortOrder].col === "date"
                                  ? "#2563eb"
                                  : "inherit",
                            }}
                          />
                        </button> */}
                      </th>

                      <th>Statut</th>

                      {/* ⚡ En-tête Durée — cliquable pour basculer asc/desc */}
                      <th>
                        Audio / Durée
                        {/* <button
                          type="button"
                          onClick={() => {
                            setSortOrder((p) =>
                              p === "duration_desc"
                                ? "duration_asc"
                                : "duration_desc",
                            );
                            setCurrentPage(1);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontWeight:
                              sortMeta[sortOrder].col === "duration"
                                ? 700
                                : 400,
                            color:
                              sortMeta[sortOrder].col === "duration"
                                ? "#2563eb"
                                : "inherit",
                            fontSize: "inherit",
                          }}
                        >
                          Audio / Durée
                          <i
                            className={`bi ${
                              sortOrder === "duration_asc"
                                ? "bi-sort-numeric-down"
                                : sortOrder === "duration_desc"
                                  ? "bi-sort-numeric-down-alt"
                                  : "bi-sort-numeric-down-alt"
                            }`}
                            style={{
                              fontSize: "0.85rem",
                              opacity:
                                sortMeta[sortOrder].col === "duration"
                                  ? 1
                                  : 0.3,
                              color:
                                sortMeta[sortOrder].col === "duration"
                                  ? "#2563eb"
                                  : "inherit",
                            }}
                          />
                        </button> */}
                      </th>

                      <th>Rappels</th>
                      {showEmailColumn && <th>Email</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {historiques.map((item) => {
                      const recordUrl = buildRecordUrl(item.pathRecord);
                      const isSelected = selectedIds.has(item._id);
                      return (
                        <tr
                          key={item._id}
                          className={isSelected ? "table-active" : ""}
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedHistorique(item)}
                        >
                          <td
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectOne(item._id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(item._id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>

                          <td>
                            <div className="fw-semibold">
                              {item.typeCall == 2 ? (
                                <i
                                  className="bi bi-telephone-inbound-fill"
                                  style={{ color: "rgb(108, 192, 112)" }}
                                />
                              ) : (
                                <i
                                  className="bi bi-telephone-outbound-fill"
                                  style={{ color: "rgb(0, 231, 235)" }}
                                />
                              )}
                              <span style={{ marginLeft: "5px" }}>
                                {item.calledNumber || "-"}
                              </span>
                            </div>
                            {item.fiche?.nom && (
                              <small
                                className="text-muted d-block"
                                title={item.fiche.nom}
                                style={{
                                  maxWidth: "220px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <i className="bi bi-person me-1" />
                                {item.fiche.nom}
                              </small>
                            )}
                            <small className="text-muted">
                              Canal : {item.channelId || "-"}
                            </small>
                          </td>

                          <td>
                            <div className="fw-semibold">
                              <i className="bi bi-megaphone me-2" />
                              {item?.campagneId?.nomCompagne || "Campagne"}
                            </div>
                            <small className="text-muted">
                              {item.callerNumber || "-"}
                            </small>
                          </td>

                          <td>
                            <div className="fw-semibold">
                              <i className="bi bi-person-badge me-2" />
                              {item.agentIaId?.nomAgent || "Agent IA"}
                            </div>
                            <small className="text-muted">Agent vocal</small>
                          </td>

                          <td>
                            <div className="fw-semibold">
                              {formatDate(item.callDate)}
                            </div>
                            <small className="text-muted">
                              <i className="bi bi-clock me-1" />
                              {formatDuration(getDurationValue(item))}
                            </small>
                          </td>

                          <td>
                            <StatusDropdown
                              itemId={item._id}
                              status={pendingStatus[item._id] ?? item.status}
                              onStatusChange={handleStatusChange}
                            />
                          </td>

                          <td onClick={(e) => e.stopPropagation()}>
                            {recordUrl ? (
                              <div>
                                <audio controls style={{ maxWidth: "220px" }}>
                                  <source src={recordUrl} />
                                  Votre navigateur ne supporte pas l'audio.
                                </audio>
                              </div>
                            ) : (
                              <span className="text-muted">
                                <i className="bi bi-volume-mute me-1" />
                                Pas d'audio
                              </span>
                            )}
                          </td>

                          <td onClick={(e) => e.stopPropagation()}>
                            <button
                              className="scd-trigger-btn"
                              onClick={() => setDrawerHistorique(item)}
                              title="Voir les rappels planifiés"
                            >
                              <i className="bi bi-clock-history" /> Rappels
                            </button>
                          </td>
                    {showEmailColumn && (
                      <td onClick={(e) => e.stopPropagation()}>
                        {item.emails?.length > 0 ? (
                          <button
                            className="scd-trigger-btn"
                            onClick={() => setEmailModalHistorique(item)}
                            title="Voir l'email envoyé"
                          >
                            <i className="bi bi-envelope-fill" /> Email
                          </button>
                        ) : (
                          <span className="text-muted">
                            <i className="bi bi-envelope-slash me-1" />
                            Pas d'email
                          </span>
                        )}
                      </td>
                    )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="historiquesPagination">
                  <button
                    className="historiquesPaginationBtn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Page précédente"
                  >
                    <i className="bi bi-chevron-left" />
                  </button>
                  {getPageNumbers().map((page, idx) =>
                    page === "..." ? (
                      <span
                        key={`e-${idx}`}
                        className="historiquesPaginationEllipsis"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        className={`historiquesPaginationBtn${currentPage === page ? " active" : ""}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ),
                  )}
                  <button
                    className="historiquesPaginationBtn"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    aria-label="Page suivante"
                  >
                    <i className="bi bi-chevron-right" />
                  </button>
                  <span className="historiquesPaginationInfo">
                    Page {currentPage} / {totalPages}
                    {" · "}
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(currentPage * ITEMS_PER_PAGE, historiques.length)}{" "}
                    sur {historiques.length}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ScheduledCallsDrawer
        open={drawerHistorique}
        historique={drawerHistorique}
        onClose={() => setDrawerHistorique(null)}
        showToast={showToast}
      />
      <HistoriqueDetailModal
        open={selectedHistorique}
        historique={selectedHistorique}
        onClose={() => setSelectedHistorique(null)}
      />

      <EmailSentModal
        open={!!emailModalHistorique}
        historique={emailModalHistorique}
        onClose={() => setEmailModalHistorique(null)}
      />

      {confirmArchive !== null && (
        <div className="modal" tabIndex="-1" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi bi-archive me-2`} />
                  {confirmArchive === 1
                    ? "Confirmer l'archivage"
                    : "Confirmer le désarchivage"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setConfirmArchive(null)}
                />
              </div>
              <div className="modal-body">
                <p>
                  {confirmArchive === 1
                    ? `Vous êtes sur le point d'archiver ${selectedIds.size} historique(s). Cette action les masquera de la vue par défaut.`
                    : `Vous êtes sur le point de désarchiver ${selectedIds.size} historique(s). Ils seront à nouveau visibles dans la liste.`}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfirmArchive(null)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className={`btn ${confirmArchive === 1 ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => handleToggleArchiveSelected(confirmArchive)}
                >
                  <i className="bi bi-archive me-1" />
                  {confirmArchive === 1 ? "Archiver" : "Désarchiver"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
