import React, { useEffect, useMemo, useState } from "react";
import HeaderBar from "../../components/agents/HeaderBar";
import useHistoriqueIa from "../../hooks/useHistoriqueIa";
import useCompagne from "../../hooks/useCompagne";
import useAgent from "../../hooks/useAgent";
import HistoriqueDetailModal from "../../components/historique/HistoriqueDetailModal.jsx";
import StatusDropdown from "../../components/historique/StatusDropdown.jsx";
import { getStatusLabel } from "../../utils/statusUtils.js";
import ScheduledCallsDrawer from "../../components/historique/ScheduledCallsDrawer.jsx";
import "../../assets/css/HistoriquesPage.css";

const ITEMS_PER_PAGE = 10;

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return (
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) +
    " " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
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
  if (hours > 0) {
    return `${hours} h ${String(minutes).padStart(2, "0")} min ${String(remainingSeconds).padStart(2, "0")} s`;
  }
  return `${minutes} min ${String(remainingSeconds).padStart(2, "0")} s`;
};

const buildRecordUrl = (pathRecord) => {
  if (!pathRecord) return "";
  if (pathRecord.startsWith("http://") || pathRecord.startsWith("https://")) {
    return pathRecord;
  }
  const base = (
    process.env.REACT_APP_HOST_API || "http://localhost:4000/api/v1/"
  )
    .replace("/api/v1/", "")
    .replace(/\/$/, "");
  return `${base}/files/${pathRecord}`;
};

const isSameOrAfter = (itemDate, startDate) => {
  if (!startDate) return true;
  const current = new Date(itemDate);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  return current >= start;
};

const isSameOrBefore = (itemDate, endDate) => {
  if (!endDate) return true;
  const current = new Date(itemDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return current <= end;
};

const hasActiveFilters = (
  search,
  selectedStatus,
  selectedCampagne,
  selectedAgentIa,
  dateStart,
  dateEnd,
  filtersArchive,
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
  timeStart !== "" ||
  timeEnd !== "";

export default function HistoriquesPage({ showToast }) {
  const { getHistoriques, archiveManyHistoriques, updateHistorique } =
    useHistoriqueIa();

  const [historiques, setHistoriques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCampagne, setSelectedCampagne] = useState("all");
  const [dateStart, setDateStart] = useState("");
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
  const [drawerHistorique, setDrawerHistorique] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedIds, setSelectedIds] = useState(new Set());

  const { getAgents } = useAgent();
  const { getCompagnes } = useCompagne();

  const handleStatusChange = async (id, newStatus) => {
    setPendingStatus((prev) => ({ ...prev, [id]: newStatus }));
    await updateHistorique(id, { status: newStatus }).then(() => {
      showToast?.("Statut mis à jour", "success");
    });
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchAgentsIa = async () => {
      try {
        const res = await getAgents();
        setAgentIas(res?.data?.data || []);
      } catch (error) {
        console.error(error);
        showToast?.("Erreur chargement agents IA", "danger");
      }
    };

    const fetchCampagnes = async () => {
      try {
        const res = await getCompagnes();
        setCampagnes(res?.data?.data || []);
      } catch (error) {
        console.error(error);
        showToast?.("Erreur chargement campagnes", "danger");
      }
    };

    fetchAgentsIa();
    fetchCampagnes();
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
  ]);

  const handleArchiveSelected = async () => {
    const ids =
      selectedIds.size > 0
        ? [...selectedIds]
        : paginatedHistoriques.map((item) => item._id);

    if (ids.length === 0) {
      return showToast?.("Aucun historique à archiver", "warning");
    }

    try {
      await archiveManyHistoriques(ids);
      showToast?.(
        selectedIds.size > 0
          ? `${ids.length} historique(s) archivé(s) avec succès`
          : "Page archivée avec succès",
        "success",
      );
      setSelectedIds(new Set());
      fetchHistoriques(currentPage);
    } catch (error) {
      console.error(error);
      showToast?.("Erreur lors de l'archivage", "danger");
    }
  };

  const handleArchiveCurrentPage = handleArchiveSelected;

  const fetchHistoriques = async (page = 1) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        clientOffset: new Date().getTimezoneOffset(),
        
      };

      if (search.trim()) params.search = search.trim();
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (selectedCampagne !== "all") params.campagneId = selectedCampagne;
      if (selectedAgentIa !== "all") params.agentIaId = selectedAgentIa;
      if (dateStart) params.dateStart = dateStart;
      if (dateEnd) params.dateEnd = dateEnd;
      if (timeStart) params.timeStart = timeStart;
      if (timeEnd) params.timeEnd = timeEnd;
      if (filtersArchive !== "all") params.archive = filtersArchive;

      const res = await getHistoriques(params);

      setHistoriques(res?.data?.data || []);
      setTotalPages(res?.data?.totalPages || 1);
      setTotalResults(res?.data?.totalResults || 0);
    } catch (error) {
      console.error(error);
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

  const getDurationValue = (item) =>
    Number(item?.callDuration ?? item?.billsec ?? 0);

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
  ]);

  const agentsIaOptions = useMemo(() => {
    const map = new Map();
    historiques.forEach((item) => {
      const agent = item?.agentIaId;
      if (agent?._id)
        map.set(agent._id, {
          _id: agent._id,
          nomAgent: agent.nomAgent || "Sans nom",
        });
    });
    return Array.from(map.values());
  }, [historiques]);

  const resetFilters = () => {
    setSearch("");
    setSelectedStatus("all");
    setSelectedCampagne("all");
    setSelectedAgentIa("all");
    setDateStart("");
    setDateEnd("");
    setTimeStart("");
    setTimeEnd("");
    setFiltersArchive("all");
  };

  const totalCallDuration = useMemo(
    () =>
      historiques.reduce((total, item) => total + getDurationValue(item), 0),
    [historiques],
  );

  const paginatedHistoriques = historiques;

  const pageIds = useMemo(
    () => paginatedHistoriques?.map((item) => item._id) ?? [],
    [
      historiques,
      search,
      selectedStatus,
      selectedCampagne,
      selectedAgentIa,
      dateStart,
      dateEnd,
      timeStart,
      timeEnd,
    ],
  );

  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected =
    !allPageSelected && pageIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const filtersActive = hasActiveFilters(
    search,
    selectedStatus,
    selectedCampagne,
    selectedAgentIa,
    dateStart,
    dateEnd,
    filtersArchive,
    timeStart,
    timeEnd,
  );

  const getCounterLabel = () => {
    if (!filtersActive)
      return `${totalResults} appel${historiques.length !== 1 ? "s" : ""} au total`;
    const count = totalResults;
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
    const suffix = parts.length > 0 ? ` — ${parts.join(", ")}` : "";
    return `${count} appel${count !== 1 ? "s" : ""} trouvé${count !== 1 ? "s" : ""}${suffix}`;
  };

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
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
            </div>

            <div className="historiquesActions">
              {/* ── Rangée 1 : Recherche + boutons d'action ── */}
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

                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={handleArchiveSelected}
                  >
                    <i className="bi bi-archive" />
                    {selectedIds.size > 0
                      ? `Archiver (${selectedIds.size})`
                      : "Archiver la page"}
                  </button>

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

              {/* ── Rangée 2 : Filtres ── */}
              <div className="historiquesActionsRow historiquesActionsRow--filters">
                {/* Groupe : Statut & Archive */}
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
                </div>

                {/* Séparateur vertical */}
                <div className="historiquesFilterDivider" />

                {/* Groupe : Campagne & Agent */}
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
                    {campagnes.map((campagne) => (
                      <option key={campagne._id} value={campagne._id}>
                        {campagne.nomCompagne}
                      </option>
                    ))}
                  </select>

                  <select
                    className="historiquesFilterSelect"
                    value={selectedAgentIa}
                    onChange={(e) => setSelectedAgentIa(e.target.value)}
                  >
                    <option value="all">Tous les agents IA</option>
                    {agentIas.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.nomAgent}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Séparateur vertical */}
                <div className="historiquesFilterDivider" />

                {/* Groupe : Dates */}
                <div className="historiquesFilterGroup">
                  <span className="historiquesFilterLabel">
                    <i className="bi bi-calendar-range" /> Période
                  </span>
                  <div className="historiquesDateFilter">
                    <input
                      type="date"
                      className="historiquesDateInput"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                    />
                    <span className="historiquesDateSeparator">→</span>
                    <input
                      type="date"
                      className="historiquesDateInput"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                    />
                  </div>
                </div>

                          
                <div className="historiquesFilterDivider" />

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
                
              </div>
            </div>
          </div>

          {loading ? (
            <div className="historiquesEmpty">
              Chargement des historiques...
            </div>
          ) : historiques.length === 0 ? (
            <div className="historiquesEmpty">Aucun historique trouvé.</div>
          ) : (
            <>
              {/* ── Barre de sélection groupée ── */}
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

              {/* ── Liste ── */}
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={
                            paginatedHistoriques.length > 0 &&
                            paginatedHistoriques.every((item) =>
                              selectedIds.has(item._id),
                            )
                          }
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th>Numéro appelé</th>
                      <th>Campagne</th>
                      <th>Agent IA</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th>Audio</th>
                      <th>Rappels</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedHistoriques.map((item) => {
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
                              <i className="bi bi-telephone-outbound me-2"></i>
                              {item.calledNumber || "-"}
                            </div>
                            <small className="text-muted">
                              Canal : {item.channelId || "-"}
                            </small>
                          </td>

                          <td>
                            <div className="fw-semibold">
                              <i className="bi bi-megaphone me-2"></i>
                              {item?.campagneId?.nomCompagne || "Campagne"}
                            </div>
                            <small className="text-muted">
                              {item.callerNumber || "-"}
                            </small>
                          </td>

                          <td>
                            <div className="fw-semibold">
                              <i className="bi bi-person-badge me-2"></i>
                              {item.agentIaId?.nomAgent || "Agent IA"}
                            </div>
                            <small className="text-muted">Agent vocal</small>
                          </td>

                          <td>
                            <div className="fw-semibold">
                              {formatDate(item.callDate)}
                            </div>
                            <small className="text-muted">
                              <i className="bi bi-clock me-1"></i>
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
                              <audio controls style={{ maxWidth: "220px" }}>
                                <source src={recordUrl} />
                                Votre navigateur ne supporte pas l'audio.
                              </audio>
                            ) : (
                              <span className="text-muted">
                                <i className="bi bi-volume-mute me-1"></i>
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
                              <i className="bi bi-clock-history" />
                              Rappels
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
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
                        key={`ellipsis-${idx}`}
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
        open={!!drawerHistorique}
        historique={drawerHistorique}
        onClose={() => setDrawerHistorique(null)}
        showToast={showToast}
      />

      <HistoriqueDetailModal
        open={!!selectedHistorique}
        historique={selectedHistorique}
        onClose={() => setSelectedHistorique(null)}
      />
    </div>
  );
}