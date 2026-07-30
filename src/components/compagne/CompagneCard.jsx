import React, { useEffect, useState } from "react";

const JOURS = {
  0: "Dim",
  1: "Lun",
  2: "Mar",
  3: "Mer",
  4: "Jeu",
  5: "Ven",
  6: "Sam",
};

// Doit rester cohérent avec TIMEZONES dans CompagneFormModal.jsx
const TIMEZONE_META = {
  "Europe/Paris": { flag: "🇫🇷", label: "France" },
  "Indian/Antananarivo": { flag: "🇲🇬", label: "Madagascar" },
};

const getTimezoneMeta = (tz) =>
  TIMEZONE_META[tz] || { flag: "🌍", label: tz || "Europe/Paris" };

// ── Horloge locale live (se met à jour chaque seconde) ──────────────────────
// Affiche l'heure dans le fuseau de la campagne, et indique si l'heure
// actuelle tombe dans une des tranches horaires autorisées.
function TimezoneLiveClock({ timeZone, allowedDays, tranches }) {
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

  const hhmm = now.toLocaleTimeString("fr-FR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const zonedDay = new Date(
    now.toLocaleString("en-US", { timeZone: tz }),
  ).getDay();

  const validTranches = (tranches || []).filter(
    (t) => t.startHour && t.endHour,
  );
  const isOpen =
    (allowedDays || []).includes(zonedDay) &&
    validTranches.some((t) => hhmm >= t.startHour && hhmm <= t.endHour);

  return (
    <span
      className={`campTzClock ${isOpen ? "is-open" : "is-closed"}`}
      title={`Heure locale — ${meta.label} (${tz})`}
    >
      <span className="campTzClock__flag">{meta.flag}</span>
      {timeLabel}
      <span className="campTzClock__dot" aria-hidden="true" />
    </span>
  );
}

export default function CompagneCard({
  compagne,
  onEdit,
  onDelete,
  lancerCampagne,
  onQualifications,
  onToggleBackgroundNoise,
  onEmailConfig,
}) {
  const isInbound = compagne.callType === "inbound";
  const isRunning = compagne.isRunning === 1;
  const isActive = compagne.active === 1;
  const numerosSecondaires = Array.isArray(compagne.numeros)
    ? compagne.numeros.filter(Boolean)
    : [];
  const maxConcurrent = compagne.maxConcurrentCalls ?? 1;
  const parListe = compagne.callStats?.parListe || [];

  const railState = isRunning ? "live" : isActive ? "ready" : "off";

  const allowedDays = compagne.allowedDays?.length
    ? compagne.allowedDays
    : [1, 2, 3, 4, 5];

  const joursLabel = allowedDays.map((jour) => JOURS[jour]).join(", ");

  // --- valeurs des 7 lignes fixes : toujours affichées, "—" si non applicable
  const agentValue = compagne.id_ia?.nomAgent || "—";

  const timeoutValue = !isInbound ? `${compagne.dialTimeout ?? 30}s` : "—";

  const appelsValue = !isInbound
    ? String(compagne.callStats?.appelsDisponibles ?? 0)
    : "—";

  const tranches = compagne.tranchesHoraires?.length
    ? compagne.tranchesHoraires
    : [
        {
          startHour: compagne.startHour || "08:00",
          endHour: compagne.endHour || "21:00",
        },
      ];

  const fichesValue = isInbound
    ? "—"
    : parListe.length > 0
      ? parListe
          .map((l) => `${l.nomFiche} (${l.disponible}/${l.total})`)
          .join(", ")
      : compagne.fiches?.length
        ? compagne.fiches.map((f) => f.nomFiche).join(", ")
        : "Non définies";

  const numerosLabel = isInbound
    ? "Numéros entrants suppl."
    : "Numéros en rotation";
  const numerosValue =
    numerosSecondaires.length > 0 ? numerosSecondaires.join(", ") : "—";

  const societeValue = compagne.companyName || "—";

  return (
    <div className={`campCard campCard--${railState}`}>
      <span className="campCard__rail" aria-hidden="true" />

      <div className="campCard__inner">
        <div className="campCard__head">
          <div className="campCard__identity">
            <span
              className={`campTypeTag ${isInbound ? "campTypeTag--in" : "campTypeTag--out"}`}
            >
              <i
                className={`bi ${
                  isInbound
                    ? "bi-telephone-inbound-fill"
                    : "bi-telephone-outbound-fill"
                }`}
              />
              {isInbound ? "Entrant" : "Sortant"}
            </span>

            <h3 className="campCard__name">{compagne.nomCompagne}</h3>

            <div className="campCard__number">
              <i className="bi bi-telephone" />
              <span>{compagne.numero || "—"}</span>
            </div>
          </div>

          {/* toolbar unique : lancer/arreter + toutes les actions rapides */}
          <div className="campCard__toolbar">
            {!isInbound && (
              <button
                type="button"
                className={`campBtnStart ${isRunning ? "is-running" : ""}`}
                onClick={() => lancerCampagne(compagne)}
              >
                {isRunning ? (
                  <>
                    <span className="campWave" aria-hidden="true">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                    Arrêter
                  </>
                ) : (
                  <>
                    <i className="bi bi-play-fill" />
                    Lancer
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              className="campIconBtn campIconBtn--tag"
              onClick={() => onQualifications(compagne)}
              title="Qualifications"
              aria-label="Qualifications"
            >
              <i className="bi bi-tags-fill" />
            </button>

            <button
              type="button"
              className="campIconBtn campIconBtn--mail"
              onClick={() => onEmailConfig(compagne)}
              title="Configuration email"
              aria-label="Configuration email"
            >
              <i className="bi bi-envelope-fill" />
            </button>

            <button
              type="button"
              className={`campIconBtn campIconBtn--noise ${compagne.backgroundNoise ? "is-on" : ""}`}
              onClick={() => onToggleBackgroundNoise(compagne)}
              title={
                compagne.backgroundNoise
                  ? "Désactiver le bruit de fond"
                  : "Activer le bruit de fond"
              }
              aria-label="Bruit de fond"
            >
              <i
                className={`bi ${
                  compagne.backgroundNoise
                    ? "bi-volume-up-fill"
                    : "bi-volume-mute-fill"
                }`}
              />
            </button>

            <button
              type="button"
              className="campIconBtn campIconBtn--edit"
              onClick={() => onEdit(compagne)}
              title="Modifier"
              aria-label="Modifier"
            >
              <i className="bi bi-pencil-square" />
            </button>

            <button
              type="button"
              className="campIconBtn campIconBtn--delete"
              onClick={() => onDelete(compagne)}
              title="Supprimer"
              aria-label="Supprimer"
            >
              <i className="bi bi-trash3" />
            </button>
          </div>
        </div>

        <div className="campCard__badges">
          <span
            className={`campPill ${isActive ? "campPill--live" : "campPill--off"}`}
          >
            <i
              className={`bi ${isActive ? "bi-check-circle-fill" : "bi-pause-circle-fill"}`}
            />
            {isActive ? "Actif" : "Inactif"}
          </span>

          <span className="campPill campPill--signal">
            <i className="bi bi-cpu-fill" />×{maxConcurrent} simultané
            {maxConcurrent > 1 ? "s" : ""}
          </span>
        </div>

        {/* 7 lignes fixes, toujours affichées (avec "—" si non applicable),
            pour garder exactement la même hauteur sur toutes les cartes */}
        <div className="campSpecs">
          <div className="campSpecRow">
            <span className="campSpecRow__label">Agent IA</span>
            <span className="campSpecRow__value" title={agentValue}>
              {agentValue}
            </span>
          </div>

          <div className="campSpecRow">
            <span className="campSpecRow__label">Timeout</span>
            <span
              className={`campSpecRow__value campMono ${timeoutValue === "—" ? "campSpecRow__value--muted" : ""}`}
            >
              {timeoutValue}
            </span>
          </div>

          <div className="campSpecRow">
            <span className="campSpecRow__label">Appels disponibles</span>
            <span
              className={`campSpecRow__value campMono ${appelsValue === "—" ? "campSpecRow__value--muted" : ""}`}
            >
              {appelsValue}
            </span>
          </div>

          <div className="campAvailability">
            <div className="campAvailability__head">
              <i className="bi bi-calendar-week" />
              <span>Disponibilité</span>
              <TimezoneLiveClock
                timeZone={compagne.timeZone}
                allowedDays={allowedDays}
                tranches={tranches}
              />
            </div>

            <div className="campAvailability__days">
              {joursLabel.split(", ").map((jour) => (
                <span key={jour} className="campDayChip">
                  {jour}
                </span>
              ))}
            </div>

            <div className="campAvailability__slots">
              {tranches.map((t, i) => (
                <span key={i} className="campSlotPill">
                  <i className="bi bi-clock" />
                  {t.startHour}–{t.endHour}
                </span>
              ))}
            </div>
          </div>

          <div className="campSpecRow">
            <span className="campSpecRow__label">Fiches</span>
            <span
              className={`campSpecRow__value ${fichesValue === "—" ? "campSpecRow__value--muted" : ""}`}
              title={fichesValue}
            >
              {fichesValue}
            </span>
          </div>

          <div className="campSpecRow">
            <span className="campSpecRow__label">{numerosLabel}</span>
            <span
              className={`campSpecRow__value campMono ${numerosValue === "—" ? "campSpecRow__value--muted" : ""}`}
              title={numerosValue}
            >
              {numerosValue}
            </span>
          </div>

          <div className="campSpecRow">
            <span className="campSpecRow__label">Société</span>
            <span
              className={`campSpecRow__value ${societeValue === "—" ? "campSpecRow__value--muted" : ""}`}
              title={societeValue}
            >
              {societeValue}
            </span>
          </div>
        </div>

        {/* script toujours visible, hauteur fixe (scroll interne si trop long) */}
        <div className="campScript">
          <div className="campScript__label">
            <i className="bi bi-chat-square-text-fill" />
            Script final
          </div>
          <div className="campScript__body">
            <p>
              {compagne.scriptFinal ||
                compagne.script ||
                "Aucun script renseigné."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}