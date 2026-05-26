import React, { useEffect, useMemo, useState } from "react";
import HeaderBar from "../../components/agents/HeaderBar";
import useHistoriqueIa from "../../hooks/useHistoriqueIa";
import HistoriqueDetailModal from "../../components/historique/HistoriqueDetailModal.jsx";
import "../../assets/css/HistoriquesPage.css";

const ITEMS_PER_PAGE = 10;

const getStatusLabel = (status) => {
  const value = Number(status);

  if (value === 2) return "RÉUSSI";
  if (value === 3) return "RAPPEL";
  if (value === 4) return "OCCUPÉ";
  if (value === 1) return "PAS_INTÉRESSÉ";
  if (value === 5) return "RÉPONDEUR";

  return "INCONNU";
};

const getStatusClass = (status) => {
  const value = Number(status);

  if (value === 2) return "RÉUSSI";
  if (value === 3) return "RAPPEL";
  if (value === 4) return "OCCUPÉ";
  if (value === 1) return "PAS_INTÉRESSÉ";
  if (value === 5) return "RÉPONDEUR";

  return "default";
};

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
    return `${hours} h ${String(minutes).padStart(2, "0")} min ${String(
      remainingSeconds
    ).padStart(2, "0")} s`;
  }

  return `${minutes} min ${String(remainingSeconds).padStart(2, "0")} s`;
};

const buildRecordUrl = (pathRecord) => {
  if (!pathRecord) return "";
  if (pathRecord.startsWith("http://") || pathRecord.startsWith("https://")) {
    return pathRecord;
  }
  const base = (process.env.REACT_APP_HOST_API || "http://localhost:4000/api/v1/")
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

const hasActiveFilters = (search, selectedStatus, selectedCampagne, selectedAgentIa, dateStart, dateEnd) =>
  search.trim() !== "" ||
  selectedStatus !== "all" ||
  selectedCampagne !== "all" ||
  selectedAgentIa !== "all" ||
  dateStart !== "" ||
  dateEnd !== "";

export default function HistoriquesPage({ showToast }) {
  const { getHistoriques } = useHistoriqueIa();

  const [historiques, setHistoriques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCampagne, setSelectedCampagne] = useState("all");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selectedHistorique, setSelectedHistorique] = useState(null);
  const [selectedAgentIa, setSelectedAgentIa] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);


  const fetchHistoriques = async () => {
    try {
      setLoading(true);

      const res = await getHistoriques();

      const data =
        Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data?.historiques)
            ? res.data.historiques
            : Array.isArray(res?.data)
              ? res.data
              : [];

      setHistoriques(data);
    } catch (error) {
      console.error("Erreur récupération historiques :", error);
      showToast?.("Erreur lors du chargement des historiques", "danger");
    } finally {
      setLoading(false);
    }
  };

  const getDurationValue = (item) => {
    return Number(item?.callDuration ?? item?.billsec ?? 0);
  };

  useEffect(() => {
    fetchHistoriques();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatus, selectedCampagne, selectedAgentIa, dateStart, dateEnd]);

  const agentsIaOptions = useMemo(() => {
    const map = new Map();
    historiques.forEach((item) => {
      const agent = item?.agentIaId;
      if (agent?._id) {
        map.set(agent._id, { _id: agent._id, nomAgent: agent.nomAgent || "Sans nom" });
      }
    });
    return Array.from(map.values());
  }, [historiques]);

  const campagnesOptions = useMemo(() => {
    const map = new Map();
    historiques.forEach((item) => {
      const campagne = item?.campagneId;
      if (campagne?._id) {
        map.set(campagne._id, { _id: campagne._id, nomCompagne: campagne.nomCompagne || "Sans nom" });
      }
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
  };

  const filteredHistoriques = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return historiques.filter((item) => {
      const statusValue = Number(item.status);
      const campagneId = item?.campagneId?._id || item?.campagneId;
      const agentIaId = item?.agentIaId?._id || item?.agentIaId;

      const matchesStatus = selectedStatus === "all" || statusValue === Number(selectedStatus);
      const matchesCampagne = selectedCampagne === "all" || String(campagneId) === String(selectedCampagne);
      const matchesAgentIa = selectedAgentIa === "all" || String(agentIaId) === String(selectedAgentIa);

      const text = [
        item.calledNumber,
        item.callerNumber,
        item.agentIaId?.nomAgent,
        item?.campagneId?.nomCompagne,
        item.channelId,
        item?.aiResponse?.description,
        item?.aiResponse?.nameUser,
        item?.aiResponse?.phoneUser,
        item?.aiResponse?.mailUser,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || text.includes(keyword);
      const matchesDateStart = isSameOrAfter(item.callDate, dateStart);
      const matchesDateEnd = isSameOrBefore(item.callDate, dateEnd);

      return matchesStatus && matchesCampagne && matchesAgentIa && matchesSearch && matchesDateStart && matchesDateEnd;
    });
  }, [historiques, search, selectedStatus, selectedCampagne, selectedAgentIa, dateStart, dateEnd]);

  const totalCallDuration = useMemo(() => {
    return filteredHistoriques.reduce((total, item) => {
      return total + getDurationValue(item);
    }, 0);
  }, [filteredHistoriques]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredHistoriques.length / ITEMS_PER_PAGE));
  const paginatedHistoriques = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistoriques.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistoriques, currentPage]);

  const filtersActive = hasActiveFilters(search, selectedStatus, selectedCampagne, selectedAgentIa, dateStart, dateEnd);

  // Build a readable label for what is filtered
  const getCounterLabel = () => {
    if (!filtersActive) return `${historiques.length} appel${historiques.length !== 1 ? "s" : ""} au total`;

    const count = filteredHistoriques.length;
    const parts = [];
    if (selectedCampagne !== "all") {
      const c = campagnesOptions.find((x) => x._id === selectedCampagne);
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

  // Generate page numbers to display (max 5 visible)
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
          <div className="historiquesHeader">
            <div>
              <h1>Journal des appels</h1>
              <p>Consultez l'historique détaillé des appels IA.</p>
              {/* ── Counter ── */}
              <div className="historiquesCounter">
                <i className="bi bi-telephone-fill" />
                <span>{getCounterLabel()}</span>
              </div>
              <div className="historiquesCounter">
                <i className="bi bi-clock-history" />
                <span>Durée totale : {formatTotalDuration(totalCallDuration)}</span>
              </div>
            </div>

            <div className="historiquesActions">
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
                value={selectedCampagne}
                onChange={(e) => setSelectedCampagne(e.target.value)}
              >
                <option value="all">Toutes les campagnes</option>
                {campagnesOptions.map((campagne) => (
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
                {agentsIaOptions.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.nomAgent}
                  </option>
                ))}
              </select>

              <div className="historiquesDateFilter">
                <input
                  type="date"
                  className="historiquesDateInput"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                />
                <span className="historiquesDateSeparator">—</span>
                <input
                  type="date"
                  className="historiquesDateInput"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                />
              </div>

              <div className="historiquesSearch">
                <i className="bi bi-search" />
                <input
                  type="text"
                  placeholder="Recherche"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button type="button" className="historiquesResetBtn" onClick={resetFilters}>
                Réinitialiser
              </button>
            </div>
          </div>

          {loading ? (
            <div className="historiquesEmpty">Chargement des historiques...</div>
          ) : filteredHistoriques.length === 0 ? (
            <div className="historiquesEmpty">Aucun historique trouvé.</div>
          ) : (
            <>
              <div className="historiquesList">
                {paginatedHistoriques.map((item) => {
                  const recordUrl = buildRecordUrl(item.pathRecord);

                  return (
                    <div
                      key={item._id}
                      className="historiqueRow"
                      onClick={() => setSelectedHistorique(item)}
                    >
                      <div className="historiqueCol historiqueNumber">
                        <div className="historiqueMain">
                          <i className="bi bi-telephone-outbound" />
                          <span>{item.calledNumber || "-"}</span>
                        </div>
                        <div className="historiqueSub">Canal : {item.channelId || "-"}</div>
                      </div>

                      <div className="historiqueCol historiqueCampagne">
                        <div className="historiqueMain">
                          <i className="bi bi-megaphone" />
                          <span>{item?.campagneId?.nomCompagne || "Campagne"}</span>
                        </div>
                        <div className="historiqueSub">{item.callerNumber || "-"}</div>
                      </div>

                      <div className="historiqueCol historiqueAgent">
                        <div className="historiqueMain">
                          <i className="bi bi-person-badge" />
                          <span>{item.agentIaId?.nomAgent || "Agent IA"}</span>
                        </div>
                        <div className="historiqueSub">Agent vocal</div>
                      </div>

                      <div className="historiqueCol historiqueDate">
                        <div className="historiqueMain">{formatDate(item.callDate)}</div>
                        <div className="historiqueSub">
                          <i className="bi bi-clock" />{" "}
                          {formatDuration(getDurationValue(item))}
                        </div>
                      </div>

                      <div className="historiqueCol historiqueBadgeCol">
                        <span className={`historiqueBadge ${getStatusClass(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>

                      <div
                        className="historiqueCol historiqueAudioCol"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {recordUrl ? (
                          <audio controls className="historiqueAudio">
                            <source src={recordUrl} />
                            Votre navigateur ne supporte pas l'audio.
                          </audio>
                        ) : (
                          <span className="historiqueNoAudio">
                            <i className="bi bi-volume-mute" /> Pas d'audio
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                      <span key={`ellipsis-${idx}`} className="historiquesPaginationEllipsis">
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
                    )
                  )}

                  <button
                    className="historiquesPaginationBtn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Page suivante"
                  >
                    <i className="bi bi-chevron-right" />
                  </button>

                  <span className="historiquesPaginationInfo">
                    Page {currentPage} / {totalPages}
                    {" · "}
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredHistoriques.length)}{" "}
                    sur {filteredHistoriques.length}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <HistoriqueDetailModal
        open={!!selectedHistorique}
        historique={selectedHistorique}
        onClose={() => setSelectedHistorique(null)}
      />
    </div>
  );
}