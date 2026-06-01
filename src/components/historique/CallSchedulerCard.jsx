import React, { useEffect, useState } from "react";
import { AudioBlock, EditForm, DeleteConfirm } from "./crudSchedulerByHistory";
import { REASON_CONFIG, STATUS_CONFIG, RESULT_CONFIG } from "../../utils/configStatus.js";
import { formatDateTime, formatRelative } from "../../utils/buildFormat.js";

export function CallCard({ call, onDelete, onUpdate }) {
  const [mode, setMode] = useState("view"); // view | edit | delete
  const [deleting, setDeleting] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);

  const reason = REASON_CONFIG[call.reason] || {
    label: call.reason,
    color: "reason-ni",
    icon: "bi-question",
  };
  const status = STATUS_CONFIG[call.status] || {
    label: call.status,
    color: "status-pending",
    icon: "bi-question",
  };
  const result = call.resultStatus ? RESULT_CONFIG[call.resultStatus] : null;
  const hasAudio = !!call._pathRecord;

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(call._id);
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (id, data) => {
    await onUpdate(id, data);
    setMode("view");
  };

  return (
    <div
      className={`scd-card ${mode === "edit" ? "scd-card--editing" : ""} ${mode === "delete" ? "scd-card--deleting" : ""}`}
    >
      {/* ── Header ── */}
      <div className="scd-card-header">
        <div className="scd-card-badges">
          <span className={`scd-badge ${reason.color}`}>
            <i className={`bi ${reason.icon}`} />
            {reason.label}
          </span>
          <span className={`scd-badge ${status.color}`}>
            <i className={`bi ${status.icon}`} />
            {status.label}
          </span>
          {result && (
            <span className={`scd-badge ${result.color}`}>
              <i className="bi bi-flag" />
              {result.label}
            </span>
          )}
        </div>

        {mode === "view" && (
          <div className="scd-card-actions">
            <button
              className={`scd-icon-btn scd-icon-btn--audio ${audioOpen ? "active" : ""} ${!hasAudio ? "disabled" : ""}`}
              onClick={() => hasAudio && setAudioOpen((v) => !v)}
              title={
                !hasAudio
                  ? "Pas d'enregistrement"
                  : audioOpen
                    ? "Masquer l'audio"
                    : "Écouter"
              }
              disabled={!hasAudio}
            >
              <i
                className={`bi ${!hasAudio ? "bi-volume-mute" : audioOpen ? "bi-volume-up-fill" : "bi-volume-up"}`}
              />
            </button>
            <button
              className="scd-icon-btn scd-icon-btn--edit"
              onClick={() => setMode("edit")}
              title="Modifier"
            >
              <i className="bi bi-pencil" />
            </button>
            <button
              className="scd-icon-btn scd-icon-btn--delete"
              onClick={() => setMode("delete")}
              title="Supprimer"
            >
              <i className="bi bi-trash3" />
            </button>
          </div>
        )}

        {mode === "edit" && (
          <button
            className="scd-icon-btn"
            onClick={() => setMode("view")}
            title="Annuler"
          >
            <i className="bi bi-x" />
          </button>
        )}
      </div>

      {/* ── Audio panel ── */}
      {audioOpen && mode === "view" && (
        <div className="scd-audio-panel">
          <AudioBlock pathRecord={call._pathRecord} label="Appel déclencheur" />
        </div>
      )}

      {/* ── Contenu selon mode ── */}
      {mode === "view" && (
        <div className="scd-card-body">
          <div className="scd-info-row">
            <i className="bi bi-telephone-outbound" />
            <div>
              <span className="scd-info-label">Numéro rappelé</span>
              <span className="scd-info-value scd-mono">
                {call.calledNumber}
              </span>
            </div>
          </div>
          <div className="scd-info-row">
            <i className="bi bi-telephone-inbound" />
            <div>
              <span className="scd-info-label">Ligne sortante</span>
              <span className="scd-info-value scd-mono">
                {call.callerNumber}
              </span>
            </div>
          </div>
          <div className="scd-info-row">
            <i className="bi bi-calendar-event" />
            <div>
              <span className="scd-info-label">Planifié le</span>
              <span className="scd-info-value">
                {formatDateTime(call.scheduledAt)}
                <em className="scd-relative">
                  {formatRelative(call.scheduledAt)}
                </em>
              </span>
            </div>
          </div>
          {call.aiResponse?.nameUser && (
            <div className="scd-info-row">
              <i className="bi bi-person" />
              <div>
                <span className="scd-info-label">Contact</span>
                <span className="scd-info-value">
                  {call.aiResponse.nameUser}
                </span>
              </div>
            </div>
          )}
          {call.aiResponse?.description && (
            <div className="scd-info-row">
              <i className="bi bi-chat-text" />
              <div>
                <span className="scd-info-label">Contexte IA</span>
                <span className="scd-info-value scd-info-value--muted">
                  {call.aiResponse.description}
                </span>
              </div>
            </div>
          )}
          {call.retryCount > 0 && (
            <div className="scd-info-row">
              <i className="bi bi-arrow-clockwise" />
              <div>
                <span className="scd-info-label">Tentatives</span>
                <span className="scd-info-value">{call.retryCount}</span>
              </div>
            </div>
          )}
          {call.notes && (
            <div className="scd-notes">
              <i className="bi bi-sticky" />
              <p>{call.notes}</p>
            </div>
          )}
        </div>
      )}

      {mode === "edit" && (
        <EditForm
          call={call}
          onSave={handleSave}
          onCancel={() => setMode("view")}
        />
      )}

      {mode === "delete" && (
        <DeleteConfirm
          call={call}
          onConfirm={handleConfirmDelete}
          onCancel={() => setMode("view")}
          deleting={deleting}
        />
      )}

      <div className="scd-card-footer">
        Créé le {formatDateTime(call.createdAt)}
      </div>
    </div>
  );
}