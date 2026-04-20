import React, { useEffect, useMemo, useState } from "react";
import HeaderBar from "../../components/agents/HeaderBar";
import useHistoriqueIa from "../../hooks/useHistoriqueIa";
import HistoriqueDetailModal from "../../components/historique/HistoriqueDetailModal.jsx";
import "../../assets/css/HistoriquesPage.css";

const getStatusLabel = (status) => {
  const value = Number(status);

  if (value === 2) return "SALE";
  if (value === 3) return "CALLBACK";
  if (value === 4) return "OCCUPÉ";
  if (value === 1) return "NI";

  return "INCONNU";
};

const getStatusClass = (status) => {
  const value = Number(status);

  if (value === 2) return "sale";
  if (value === 3) return "callback";
  if (value === 4) return "busy";
  if (value === 1) return "ni";

  return "default";
};

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "-";

  return (
    d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    }) +
    " " +
    d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
};

const formatDuration = (seconds) => {
  const sec = Number(seconds || 0);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
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

  const fetchHistoriques = async () => {
    try {
      setLoading(true);
      const res = await getHistoriques();
      const data = res?.data?.data || [];
      console.log("Fetched historiques:", data);
      setHistoriques(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur récupération historiques :", error);
      showToast?.("Erreur lors du chargement des historiques", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoriques();
  }, []);

  const agentsIaOptions = useMemo(() => {
    const map = new Map();

    historiques.forEach((item) => {
      const agent = item?.agentIaId;

      if (agent?._id) {
        map.set(agent._id, {
          _id: agent._id,
          nomAgent: agent.nomAgent || "Sans nom",
        });
      }
    });

    return Array.from(map.values());
  }, [historiques]);

  const campagnesOptions = useMemo(() => {
    const map = new Map();

    historiques.forEach((item) => {
      const campagne = item?.campagneId;

      if (campagne?._id) {
        map.set(campagne._id, {
          _id: campagne._id,
          nomCompagne: campagne.nomCompagne || "Sans nom",
        });
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

      const matchesStatus =
        selectedStatus === "all" || statusValue === Number(selectedStatus);

      const matchesCampagne =
        selectedCampagne === "all" || String(campagneId) === String(selectedCampagne);

      const matchesAgentIa =
        selectedAgentIa === "all" || String(agentIaId) === String(selectedAgentIa);

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

      return (
        matchesStatus &&
        matchesCampagne &&
        matchesAgentIa &&
        matchesSearch &&
        matchesDateStart &&
        matchesDateEnd
      );
    });
  }, [historiques, search, selectedStatus, selectedCampagne, selectedAgentIa, dateStart, dateEnd]);

  return (
    <div className="historiquesPage">
      <HeaderBar />

      <div className="historiquesContainer">
        <div className="historiquesCard">
          <div className="historiquesHeader">
            <div>
              <h1>Journal des appels</h1>
              <p>Consultez l’historique détaillé des appels IA.</p>
            </div>

            <div className="historiquesActions">
              <select
                className="historiquesFilterSelect"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="2">SALE</option>
                <option value="3">CALLBACK</option>
                <option value="4">OCCUPÉ</option>
                <option value="1">NI</option>
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

              <button
                type="button"
                className="historiquesResetBtn"
                onClick={resetFilters}
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {loading ? (
            <div className="historiquesEmpty">Chargement des historiques...</div>
          ) : filteredHistoriques.length === 0 ? (
            <div className="historiquesEmpty">Aucun historique trouvé.</div>
          ) : (
            <div className="historiquesList">
              {filteredHistoriques.map((item) => {
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
                      <div className="historiqueSub">
                        Canal : {item.channelId || "-"}
                      </div>
                    </div>

                    <div className="historiqueCol historiqueCampagne">
                      <div className="historiqueMain">
                        <i className="bi bi-megaphone" />
                        <span>{item?.campagneId?.nomCompagne || "Campagne"}</span>
                      </div>
                      <div className="historiqueSub">
                        {item.callerNumber || "-"}
                      </div>
                    </div>

                    <div className="historiqueCol historiqueAgent">
                      <div className="historiqueMain">
                        <i className="bi bi-person-badge" />
                        <span>{item.agentIaId?.nomAgent || "Agent IA"}</span>
                      </div>
                      <div className="historiqueSub">
                        Agent vocal
                      </div>
                    </div>

                    <div className="historiqueCol historiqueDate">
                      <div className="historiqueMain">{formatDate(item.callDate)}</div>
                      <div className="historiqueSub">
                        <i className="bi bi-clock" />{" "}
                        {formatDuration(item.billsec || item.callDuration)}
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
                          Votre navigateur ne supporte pas l’audio.
                        </audio>
                      ) : (
                        <span className="historiqueNoAudio">
                          <i className="bi bi-volume-mute" /> Pas d’audio
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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