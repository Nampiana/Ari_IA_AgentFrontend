import React, { useEffect, useState } from "react";
import { buildRecordUrl } from "../../utils/buildFormat.js";
import { REASON_CONFIG, STATUS_CONFIG } from "../../utils/configStatus.js";
import { formatDateTime } from "../../utils/buildFormat.js";

/**
 * Convertit une date JS/ISO vers le format attendu par input datetime-local
 * SANS conversion UTC.
 *
 * Exemple :
 * 2026-07-07T07:40:00.000Z affiché localement en 10:40
 * devient bien : 2026-07-07T10:40
 */
function toDateTimeLocalValue(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Transforme la valeur de datetime-local vers Date JS.
 * Le navigateur interprète correctement selon l'heure locale.
 */
function fromDateTimeLocalValue(value) {
  if (!value) return null;
  return new Date(value);
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
  const defaultDate = () => {
    const d = new Date(Date.now() + 3_600_000);

    if (d.getMinutes() < 30) {
      d.setMinutes(30);
    } else {
      d.setHours(d.getHours() + 1);
      d.setMinutes(0);
    }

    d.setSeconds(0);
    d.setMilliseconds(0);

    return toDateTimeLocalValue(d);
  };

  const [scheduledAt, setScheduledAt] = useState(defaultDate());
  const [reason, setReason] = useState("CALLBACK");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    onAdd({
      scheduledAt: fromDateTimeLocalValue(scheduledAt),
      reason,
      notes: notes.trim() || undefined,
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
            min={toDateTimeLocalValue(new Date())}
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
            <strong>{historique?.callerNumber}</strong>
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setScheduledAt(toDateTimeLocalValue(call?.scheduledAt));
    setNotes(call?.notes || "");
    setStatus(call?.status || "pending");
  }, [call]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      await onSave(call._id, {
        scheduledAt: fromDateTimeLocalValue(scheduledAt),
        notes,
        status,
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
          <strong>{formatDateTime(call.scheduledAt)}</strong> ?
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