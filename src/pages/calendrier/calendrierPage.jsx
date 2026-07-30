import React, { useEffect, useMemo, useState, useCallback } from "react";
import HeaderBar from "../../components/agents/HeaderBar";
import useScheduledCall from "../../hooks/useScheduledCall";
import useHistoriqueIa from "../../hooks/useHistoriqueIa";
import useCrmLead from "../../hooks/useCrmLead";
import DayDetailModal from "../../components/calendrier/DayDetailModal";
import {
  WEEK_DAYS,
  SOURCE_DEFS,
  REASON_DEFS,
  STATUS_TO_REASON,
  FILTER_CHIPS,
  getSourceDef,
  getReasonDef,
  mondayFirstIndex,
  toLocalDateKey,
} from "../../components/calendrier/calendrierConstants";
import "../../assets/css/calendrierPage.css";

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

      // Un seul tableau global, redistribué ensuite par crmStatus dans groupedData
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
            ? (item.telephone || item.fiche?.phone || "").toLowerCase()
            : (item.calledNumber || item.fiche?.phone || "").toLowerCase();
        const name =
          type === "crm"
            ? (item.nom || item.fiche?.nom || "").toLowerCase()
            : (
                item.aiResponse?.nameUser ||
                item.fiche?.nom ||
                ""
              ).toLowerCase();
        if (!num.includes(q) && !name.includes(q)) return false;
      }

      if (statusFilter !== "ALL" && type !== "crm") {
        const reason =
          type === "historique"
            ? STATUS_TO_REASON[item.status] || ""
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

  // Les leads CRM sans callbackDate ne sont pas groupés ici (étagère dédiée
  // désactivée pour le moment, cf. bloc commenté plus bas dans le rendu).
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

    // crmStatus 1 (Confirmé) → section CRM, peu importe la date
    crmLeads
      .filter((l) => l.crmStatus === 1 && matchesFilters(l, "crm"))
      .forEach((l) => {
        if (!l.historiqueId?.callDate) return; // sans date → étagère dédiée
        const key = toLocalDateKey(new Date(l.historiqueId.callDate));
        if (!map[key])
          map[key] = { historiques: [], scheduled: [], crmLeads: [] };
        map[key].crmLeads.push(l);
      });

    // crmStatus 2 (Non confirmé) avec date → traité comme un rappel
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
          calledNumber: l.telephone || l.fiche?.phone,
          callerNumber: l.historiqueId?.calledNumber || "—",
          scheduledAt: l.callbackDate,
          reason: "RAPPEL",
          status: "pending",
          source: 3,
          aiResponse: {
            nameUser: l.nom || l.fiche?.nom,
            description: l.note,
          },
          _pathRecord: l.historiqueId?.pathRecord,
        });
      });
    return map;
  }, [historiques, scheduledCalls, crmLeads, matchesFilters]);

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

  // Stats du bandeau hero — vue d'ensemble, non filtrée par les contrôles fins
  const heroStats = useMemo(() => {
    const totalEvents =
      historiques.length + scheduledCalls.length + crmLeads.length;
    const rappelsPending = scheduledCalls.filter(
      (s) => s.status === "pending",
    ).length;
    const ventes = historiques.filter((h) => h.status === 2).length;
    const crmConfirmed = crmLeads.filter((l) => l.crmStatus === 1).length;
    return { totalEvents, rappelsPending, ventes, crmConfirmed };
  }, [historiques, scheduledCalls, crmLeads]);

  // Densité par jour du mois affiché — alimente la jauge .calDay__volume,
  // signature visuelle du calendrier (le remplissage montre en un coup d'œil
  // les jours les plus chargés du mois, relativement au jour le plus actif).
  const maxDayTotal = useMemo(() => {
    let max = 0;
    cells.forEach((day) => {
      if (!day) return;
      const data = groupedData[toLocalDateKey(day)];
      if (!data) return;
      const total =
        data.historiques.length + data.scheduled.length + data.crmLeads.length;
      if (total > max) max = total;
    });
    return max || 1;
  }, [groupedData, month, year]);

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

  return (
    <div className="calPage">
      <HeaderBar />

      <div className="calContainer">
        {/* ── HERO ── */}
        <section className="calHero">
          <div className="calHero__text">
            <span className="calHero__eyebrow">
              <span className="calHero__dot" />
              Planning des appels
            </span>
            <h1>Calendrier</h1>
            <p>
              Suivez en un coup d'œil les appels réalisés, les rappels
              programmés et les leads CRM à relancer.
            </p>
          </div>

          <div className="calHero__stats">
            <div className="calStat">
              <span className="calStat__icon">
                <i className="bi bi-calendar-event" />
              </span>
              <span className="calStat__value">{heroStats.totalEvents}</span>
              <span className="calStat__label">Événements</span>
            </div>
            <div className="calStat calStat--rappel">
              <span className="calStat__icon">
                <i className="bi bi-telephone-outbound" />
              </span>
              <span className="calStat__value">{heroStats.rappelsPending}</span>
              <span className="calStat__label">Rappels en attente</span>
            </div>
            <div className="calStat calStat--sale">
              <span className="calStat__icon">
                <i className="bi bi-trophy" />
              </span>
              <span className="calStat__value">{heroStats.ventes}</span>
              <span className="calStat__label">Ventes / RDV</span>
            </div>
            <div className="calStat calStat--crm">
              <span className="calStat__icon">
                <i className="bi bi-person-badge" />
              </span>
              <span className="calStat__value">{heroStats.crmConfirmed}</span>
              <span className="calStat__label">Leads confirmés</span>
            </div>
          </div>
        </section>

        {/* ── TOOLBAR : recherche + filtres + statuts ── */}
        <section className="calToolbar">
          <div className="calToolbar__row">
            <div className="calSearch">
              <i className="bi bi-search" />
              <input
                type="text"
                placeholder="N° de téléphone, nom client…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="calSearch__clear"
                  onClick={() => setSearchQuery("")}
                  title="Effacer"
                >
                  ×
                </button>
              )}
            </div>

            <select
              className="calSelect"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="ALL">Toutes les sources</option>
              <option value="1">Auto</option>
              <option value="2">Manuel</option>
              <option value="3">CRM</option>
            </select>

            <select
              className="calSelect"
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
              className="calSelect"
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
                type="button"
                className="calResetBtn"
                onClick={resetFilters}
              >
                <i className="bi bi-x-circle" />
                Réinitialiser
              </button>
            )}
          </div>

          <div className="calToolbar__chips">
            {FILTER_CHIPS.map(({ key, label, chipClass }) => (
              <button
                key={key}
                type="button"
                className={`calChip ${chipClass}`}
                data-active={statusFilter === key}
                onClick={() => setStatusFilter(key)}
              >
                {key !== "ALL" && (
                  <span
                    className="calChip__dot"
                    style={{ background: getReasonDef(key).dotVar }}
                  />
                )}
                {label}
              </button>
            ))}

            {hasActiveFilter && (
              <span className="calToolbar__resultCount">
                {filteredTotal} résultat{filteredTotal > 1 ? "s" : ""}
              </span>
            )}

            <div className="calToolbar__sources">
              {Object.entries(SOURCE_DEFS).map(([key, def]) => (
                <span
                  key={key}
                  className={`calSourceLegend ${def.legendClass}`}
                >
                  <i className={`bi ${def.icon}`} />
                  {def.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── NAVIGATION MOIS ── */}
        <div className="calMonthNav">
          <button type="button" className="calNavBtn" onClick={prevMonth}>
            <i className="bi bi-chevron-left" />
          </button>
          <div className="calMonthNav__center">
            <h3>{monthLabel}</h3>
            <button type="button" className="calTodayBtn" onClick={goToday}>
              Aujourd'hui
            </button>
          </div>
          <button type="button" className="calNavBtn" onClick={nextMonth}>
            <i className="bi bi-chevron-right" />
          </button>
        </div>

        {loading && (
          <div className="calLoading">
            <span className="calLoading__spinner" />
            Chargement du calendrier…
          </div>
        )}

        {/* ── GRILLE CALENDRIER ── */}
        <div className="calWeekHeader">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="calWeekHeader__day">
              {d}
            </div>
          ))}
        </div>

        <div className="calGrid">
          {cells.map((day, index) => {
            if (!day) {
              return (
                <div key={`empty-${index}`} className="calDay calDay--empty" />
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
            const densityPct = Math.min(
              100,
              Math.round((total / maxDayTotal) * 100),
            );

            const dayClasses = [
              "calDay",
              hasData ? "calDay--has-data" : "",
              isToday ? "calDay--today" : "",
              hasActiveFilter && !hasData ? "calDay--faded" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={key}
                className={dayClasses}
                onClick={() => hasData && setSelectedDay({ date: key, data })}
              >
                <div className="calDay__top">
                  <span className="calDay__num">{day.getDate()}</span>
                  {total > 0 && <span className="calDay__count">{total}</span>}
                </div>

                {data.historiques.slice(0, 2).map((h) => {
                  const reasonDef = getReasonDef(STATUS_TO_REASON[h.status]);
                  return (
                    <div key={h._id} className="calDay__item">
                      <span
                        className="calDay__itemDot"
                        style={{ background: reasonDef.dotVar }}
                      />
                      <span>{h.fiche?.nom || h.calledNumber}</span>
                    </div>
                  );
                })}

                {data.scheduled.slice(0, 2).map((s) => {
                  const sourceDef = getSourceDef(s.source);
                  const reasonDef = getReasonDef(s.reason);
                  return (
                    <div key={s._id} className="calDay__item">
                      <i
                        className={`bi ${sourceDef.icon} calDay__itemIcon`}
                        title={sourceDef.label}
                      />
                      <span
                        className="calDay__itemDot"
                        style={{ background: reasonDef.dotVar }}
                      />
                      <span>{s.calledNumber}</span>
                    </div>
                  );
                })}

                {data.crmLeads.slice(0, 2).map((l) => (
                  <div key={l._id} className="calDay__item">
                    <i
                      className="bi bi-person-badge-fill calDay__itemIcon"
                      style={{ color: "var(--cal-source-crm)" }}
                      title="CRM"
                    />
                    <span
                      className="calDay__itemDot"
                      style={{ background: "var(--cal-sale)" }}
                    />
                    <span>{l.telephone || l.fiche?.phone || "-"}</span>
                  </div>
                ))}

                {total > 6 && (
                  <div className="calDay__more">
                    +{total - 6} autre{total - 6 > 1 ? "s" : ""}
                  </div>
                )}

                {hasData && (
                  <div className="calDay__volume">
                    <div
                      className="calDay__volumeFill"
                      style={{ width: `${densityPct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── LÉGENDE STATUTS ── */}
        <div className="calLegend">
          {Object.entries(REASON_DEFS)
            .filter(([key]) => key !== "CALLBACK")
            .map(([key, def]) => (
              <div key={key} className="calLegend__item">
                <span
                  className="calLegend__dot"
                  style={{ background: def.dotVar }}
                />
                {def.label}
              </div>
            ))}
        </div>
      </div>

      <DayDetailModal
        selectedDay={selectedDay}
        onClose={() => setSelectedDay(null)}
        hasActiveFilter={hasActiveFilter}
        onDeleteScheduled={handleDelete}
      />
    </div>
  );
}
