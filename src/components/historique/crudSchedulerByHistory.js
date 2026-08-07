import React, { useEffect, useState } from "react";
import { buildRecordUrl } from "../../utils/buildFormat.js";
import { REASON_CONFIG, STATUS_CONFIG } from "../../utils/configStatus.js";
import { formatDateTime } from "../../utils/buildFormat.js";
import {
  TIMEZONE_OPTIONS,
  getTimeZoneFlag,
} from "../../utils/timezoneUtils.js";

/**
 * Convertit une date JS/ISO vers le format attendu par input datetime-local
 * SANS conversion UTC.
 *
 * Exemple :
 * 2026-07-07T07:40:00.000Z affiché localement en 10:40
 * devient bien : 2026-07-07T10:40
 */
function toDateTimeLocalValue(value, timeZone = "Europe/Paris") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  // Formate la date dans le fuseau cible (pas celui du navigateur)
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = dtf.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function fromDateTimeLocalValue(value, timeZone = "Europe/Paris") {
  if (!value) return null;

  // "value" = heure murale voulue DANS timeZone (ex: 10:40 à Madagascar)
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  // 1) on interprète naïvement ces chiffres comme si c'était de l'UTC
  const naiveUTC = Date.UTC(year, month - 1, day, hour, minute, 0);

  // 2) on regarde quelle heure ça donnerait dans "timeZone" à cet instant naïf
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(naiveUTC)).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  const asIfUTCInTz = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  // 3) l'écart entre les deux donne le décalage réel du fuseau à cet instant,
  //    qu'on retire pour obtenir le vrai instant UTC correspondant à l'heure murale voulue
  const offset = asIfUTCInTz - naiveUTC;
  return new Date(naiveUTC - offset);
}

export function AudioBlock({ pathRecord, label }) {
  const url = buildRecordUrl(pathRecord);

  if (!url) {
    return (
      <div className="scd-audio-empty">
        <i className="bi bi-volume-mute" />
        <span>Pas d'enregistrement</span>
      </div>
    );
  }

  return (
    <div className="scd-audio-wrap">
      {label && (
        <div className="scd-audio-label">
          <i className="bi bi-mic-fill" />
          {label}
        </div>
      )}

      <audio controls preload="none" className="scd-audio">
        <source src={url} />
      </audio>
    </div>
  );
}

export function AddCallForm({ historique, onAdd, onCancel, saving }) {
  const initialTimeZone = historique?.timeZone || "Europe/Paris"; // ← AJOUT

  const defaultDate = (timeZone = initialTimeZone) => {
    // ← AJOUT paramètre
    const d = new Date(Date.now() + 3_600_000);

    if (d.getMinutes() < 30) {
      d.setMinutes(30);
    } else {
      d.setHours(d.getHours() + 1);
      d.setMinutes(0);
    }

    d.setSeconds(0);
    d.setMilliseconds(0);

    return toDateTimeLocalValue(d, timeZone); // ← AJOUT timeZone
  };

  const [scheduledAt, setScheduledAt] = useState(() => defaultDate()); // utilise initialTimeZone au premier rendu
  const [reason, setReason] = useState("CALLBACK");
  const [notes, setNotes] = useState("");
  const [timeZone, setTimeZone] = useState(initialTimeZone); // ← réutilise la même valeur, cohérent avec scheduledAt

  // ← AJOUT : quand l'utilisateur change de fuseau, on garde la même heure "murale"
  // saisie mais on recalcule l'affichage pour rester cohérent avec le nouveau fuseau,
  // en repartant de l'instant réellement visé (calculé dans l'ancien fuseau).
  const handleTimeZoneChange = (newTimeZone) => {
    const currentInstant = fromDateTimeLocalValue(scheduledAt, timeZone);
    if (currentInstant) {
      setScheduledAt(toDateTimeLocalValue(currentInstant, newTimeZone));
    }
    setTimeZone(newTimeZone);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onAdd({
      scheduledAt: fromDateTimeLocalValue(scheduledAt, timeZone), // ← AJOUT timeZone, le vrai fix
      reason,
      notes: notes.trim() || undefined,
      timeZone,
    });
  };

  return (
    <div className="scd-add-form-wrap">
      <div className="scd-add-form-header">
        <i className="bi bi-plus-circle" />
        <span>Nouveau rappel</span>
      </div>

      <form className="scd-edit-form" onSubmit={handleSubmit}>
        <div className="scd-edit-field">
          <label>Date & heure</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={toDateTimeLocalValue(new Date(), timeZone)}
            required
          />
        </div>

        <div className="scd-edit-field">
          <label>Raison</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            {Object.entries(REASON_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div className="scd-edit-field">
          <label>Fuseau horaire</label>
          <select
            value={timeZone}
            onChange={(e) => handleTimeZoneChange(e.target.value)} // ← AJOUT
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.flag} {tz.label}
              </option>
            ))}
          </select>
        </div>

        <div className="scd-edit-field">
          <label>
            Notes internes{" "}
            <span style={{ opacity: 0.5, fontWeight: 400 }}>(optionnel)</span>
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex : client préfère être rappelé le matin…"
            rows={2}
          />
        </div>

        <div className="scd-add-form-info">
          <i className="bi bi-info-circle" />
          <span>
            Numéro : <strong>{historique?.calledNumber}</strong> · Ligne :{" "}
            <strong>{historique?.callerNumber}</strong> · Heure saisie en{" "}
            <strong>
              {getTimeZoneFlag(timeZone)} {timeZone}
            </strong>
          </span>
        </div>

        <div className="scd-edit-actions">
          <button
            type="button"
            className="scd-btn-cancel"
            onClick={onCancel}
            disabled={saving}
          >
            Annuler
          </button>

          <button
            type="submit"
            className="scd-btn-save scd-btn-add"
            disabled={saving}
          >
            {saving ? (
              <>
                <i className="bi bi-arrow-repeat scd-spin" /> Création…
              </>
            ) : (
              <>
                <i className="bi bi-plus-lg" /> Créer le rappel
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditForm({ call, onSave, onCancel }) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pending");
  const [timeZone, setTimeZone] = useState("Europe/Paris");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setScheduledAt(
      toDateTimeLocalValue(call?.scheduledAt, call?.timeZone || "Europe/Paris"),
    );
    setNotes(call?.notes || "");
    setStatus(call?.status || "pending");
    setTimeZone(call?.timeZone || "Europe/Paris");
  }, [call]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      await onSave(call._id, {
        scheduledAt: fromDateTimeLocalValue(scheduledAt, timeZone),
        notes,
        status,
        timeZone, // ← AJOUT
      });
    } finally {
      setSaving(false);
    }
  };
  return (
    <form className="scd-edit-form" onSubmit={handleSubmit}>
      <div className="scd-edit-field">
        <label>Date & heure du rappel</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          required
        />
      </div>

      <div className="scd-edit-field">
        <label>Fuseau horaire</label>
        <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)}>
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.flag} {tz.label}
            </option>
          ))}
        </select>
      </div>

      <div className="scd-edit-field">
        <label>Statut</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="scd-edit-field">
        <label>Notes internes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ajouter une note…"
          rows={3}
        />
      </div>

      <div className="scd-edit-actions">
        <button type="button" className="scd-btn-cancel" onClick={onCancel}>
          Annuler
        </button>

        <button type="submit" className="scd-btn-save" disabled={saving}>
          {saving ? (
            <>
              <i className="bi bi-arrow-repeat scd-spin" /> Enregistrement…
            </>
          ) : (
            <>
              <i className="bi bi-check2" /> Enregistrer
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function DeleteConfirm({ call, onConfirm, onCancel, deleting }) {
  return (
    <div className="scd-delete-confirm">
      <div className="scd-delete-confirm-body">
        <div className="scd-delete-icon">
          <i className="bi bi-exclamation-triangle" />
        </div>

        <p>
          Supprimer ce rappel planifié le{" "}
          <strong>{formatDateTime(call.scheduledAt, call.timeZone)}</strong> ?
        </p>

        <p className="scd-delete-sub">Cette action est irréversible.</p>
      </div>

      <div className="scd-delete-confirm-actions">
        <button
          className="scd-btn-cancel"
          onClick={onCancel}
          disabled={deleting}
        >
          Annuler
        </button>

        <button
          className="scd-btn-delete"
          onClick={onConfirm}
          disabled={deleting}
        >
          {deleting ? (
            <>
              <i className="bi bi-arrow-repeat scd-spin" /> Suppression…
            </>
          ) : (
            <>
              <i className="bi bi-trash3" /> Supprimer
            </>
          )}
        </button>
      </div>
    </div>
  );
}
