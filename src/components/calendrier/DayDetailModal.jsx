import React, { useEffect, useMemo, useState } from "react";
import UnifiedCard from "./UnifiedCard";
import { SourceBadge, ReasonBadge } from "./Badges";
import {
  DAY_SECTIONS,
  STATUS_TO_REASON,
  CRM_STATUS_DEFS,
  SCHEDULED_STATUS,
  getReasonDef,
  formatDuration,
} from "../../utils/calendrierConstants.js";

export default function DayDetailModal({
  selectedDay,
  onClose,
  hasActiveFilter,
  onDeleteScheduled,
}) {
  const counts = useMemo(
    () => ({
      historiques: selectedDay?.data.historiques.length || 0,
      crmLeads: selectedDay?.data.crmLeads.length || 0,
      scheduled: selectedDay?.data.scheduled.length || 0,
    }),
    [selectedDay],
  );

  const firstNonEmpty =
    DAY_SECTIONS.find((s) => counts[s.key] > 0)?.key || "historiques";
  const [activeTab, setActiveTab] = useState(firstNonEmpty);

  // Recale l'onglet actif à chaque ouverture d'un nouveau jour.
  useEffect(() => {
    if (selectedDay) setActiveTab(firstNonEmpty);
  }, [selectedDay?.date]);

  useEffect(() => {
    if (!selectedDay) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedDay, onClose]);

  if (!selectedDay) return null;

  const dateLabel = new Date(selectedDay.date + "T12:00:00").toLocaleDateString(
    "fr-FR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  const totalCount = counts.historiques + counts.crmLeads + counts.scheduled;

  return (
    <div
      className="calModalOverlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="calModal">
        <div className="calModal__header">
          <div className="calModal__headerText">
            <span className="calModal__eyebrow">
              {totalCount} événement{totalCount > 1 ? "s" : ""}
            </span>
            <h5>{dateLabel}</h5>
          </div>
          <button
            type="button"
            className="calModal__close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="calModal__tabs">
          {DAY_SECTIONS.map((section) => (
            <button
              key={section.key}
              type="button"
              className="calModalTab"
              data-active={activeTab === section.key}
              style={{
                "--tab-accent": section.accentVar,
                "--tab-accent-soft": section.accentSoftVar,
              }}
              onClick={() => setActiveTab(section.key)}
            >
              <i className={`bi ${section.icon}`} />
              {section.label}
              <span className="calModalTab__count">{counts[section.key]}</span>
            </button>
          ))}
        </div>

        <div className="calModal__body">
          {activeTab === "historiques" && (
            <HistoriquesTab
              items={selectedDay.data.historiques}
              hasActiveFilter={hasActiveFilter}
            />
          )}
          {activeTab === "crmLeads" && (
            <CrmTab
              items={selectedDay.data.crmLeads}
              hasActiveFilter={hasActiveFilter}
            />
          )}
          {activeTab === "scheduled" && (
            <ScheduledTab
              items={selectedDay.data.scheduled}
              hasActiveFilter={hasActiveFilter}
              onDelete={onDeleteScheduled}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Onglet : historique d'appels réels ────────────────────────────────────

function HistoriquesTab({ items, hasActiveFilter }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="bi-telephone"
        text={`Aucun appel ce jour${hasActiveFilter ? " (filtre actif)" : ""}`}
      />
    );
  }

  return (
    <>
      {items.map((h) => {
        const reasonKey = STATUS_TO_REASON[h.status];
        const time = new Date(h.callDate).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const displayTitle = h.fiche?.nom || h.calledNumber;

        return (
          <UnifiedCard
            key={h._id}
            icon="bi-telephone-fill"
            accentVar="var(--cal-repondeur)"
            title={displayTitle}
            subtitle={h.aiResponse?.nameUser || h.calledNumber}
            description={h.aiResponse?.description}
            badges={
              <>
                <span className="calBadge calBadge--neutral">
                  <i className="bi bi-telephone-fill" />
                  Appel réel
                </span>
                <ReasonBadge reasonKey={reasonKey} />
              </>
            }
            metaItems={[
              { icon: "bi-clock", text: time },
              ...(h.billsec !== undefined
                ? [{ icon: "bi-stopwatch", text: formatDuration(h.billsec) }]
                : []),
              ...(h.callerNumber
                ? [{ icon: "bi-telephone-inbound", text: h.callerNumber }]
                : []),
            ]}
            audioPath={h.pathRecord}
          />
        );
      })}
    </>
  );
}

// ─── Onglet : leads CRM confirmés ──────────────────────────────────────────

function CrmTab({ items, hasActiveFilter }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="bi-person-badge"
        text={`Aucun lead CRM ce jour${hasActiveFilter ? " (filtre actif)" : ""}`}
      />
    );
  }

  return (
    <>
      {items.map((lead) => {
        const statusDef = CRM_STATUS_DEFS[lead.crmStatus] || CRM_STATUS_DEFS[1];
        const displayNom = lead.nom || lead.fiche?.nom || "Lead sans nom";
        const displayTelephone = lead.telephone || lead.fiche?.phone;
        const displayEntreprise = lead.entreprise || lead.fiche?.entreprise;
        const displayEmail = lead.email || lead.fiche?.email;

        return (
          <UnifiedCard
            key={lead._id}
            icon="bi-person-badge-fill"
            accentVar="var(--cal-source-crm)"
            title={displayNom}
            subtitle={displayTelephone}
            description={lead.note || displayEntreprise}
            badges={
              <>
                <SourceBadge source={3} />
                <span className={`calBadge ${statusDef.badgeClass}`}>
                  <i className={`bi ${statusDef.icon}`} />
                  {statusDef.label}
                </span>
              </>
            }
            metaItems={[
              ...(displayEmail
                ? [{ icon: "bi-envelope-fill", text: displayEmail }]
                : []),
              {
                icon: "bi-megaphone",
                text: lead.campagneId?.nomCompagne || "Campagne inconnue",
              },
              ...(lead.assignedTo
                ? [{ icon: "bi-person-check", text: lead.assignedTo }]
                : []),
            ]}
            audioPath={lead.historiqueId?.pathRecord}
          />
        );
      })}
    </>
  );
}

// ─── Onglet : rappels planifiés ────────────────────────────────────────────

function ScheduledTab({ items, hasActiveFilter, onDelete }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="bi-telephone-outbound"
        text={`Aucun rappel ce jour${hasActiveFilter ? " (filtre actif)" : ""}`}
      />
    );
  }

  return (
    <>
      {items.map((s) => {
        const ssDef = SCHEDULED_STATUS[s.status] || {
          label: s.status,
          badgeClass: "calBadge--neutral",
        };
        const time = new Date(s.scheduledAt).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const displayTitle = s.fiche?.nom || s.calledNumber;

        return (
          <UnifiedCard
            key={s._id}
            icon="bi-telephone-outbound-fill"
            accentVar="var(--cal-rappel)"
            title={displayTitle}
            subtitle={s.aiResponse?.nameUser || "Inconnu"}
            description={s.aiResponse?.description}
            badges={
              <>
                <SourceBadge source={s.source} />
                <ReasonBadge reasonKey={s.reason} />
                {!s._isCrmReminder && (
                  <span className={`calBadge ${ssDef.badgeClass}`}>
                    {ssDef.label}
                  </span>
                )}
                {s._isCrmReminder && (
                  <span className="calBadge calBadge--gray">
                    <i className="bi bi-x-circle" />
                    Non confirmé
                  </span>
                )}
                {s.resultStatus && (
                  <span className="calBadge calBadge--neutral">
                    <i className="bi bi-flag" />
                    {getReasonDef(s.resultStatus).label}
                  </span>
                )}
              </>
            }
            metaItems={[
              { icon: "bi-clock", text: time },
              { icon: "bi-telephone-inbound", text: s.callerNumber },
            ]}
            audioPath={s._pathRecord}
            onDelete={!s._isCrmReminder ? () => onDelete(s._id) : null}
          />
        );
      })}
    </>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="calEmptyNote">
      <i className={`bi ${icon}`} />
      {text}
    </div>
  );
}
