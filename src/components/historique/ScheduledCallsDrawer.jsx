import React, { useEffect, useState } from "react";
import useScheduledCall from "../../hooks/useScheduledCall";
import { STATUS_CONFIG } from "../../utils/configStatus.js";
import { formatDateTime } from "../../utils/buildFormat.js";
import { AudioBlock, AddCallForm } from "./crudSchedulerByHistory";
import { CallCard } from "./CallSchedulerCard.jsx";
import "../../assets/css/ScheduledCallsDrawer.css";
import { getTimeZoneFlag } from "../../utils/timezoneUtils.js";

export default function ScheduledCallsDrawer({
  historique,
  open,
  onClose,
  showToast,
}) {
  const {
    getScheduledCallsByHistorique,
    deleteScheduledCall,
    updateScheduledCall,
    createScheduledCall,
  } = useScheduledCall();

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [rootAudio, setRootAudio] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!open || !historique?._id) return;
    setFilter("all");
    setShowAdd(false);
    loadAll();
  }, [open, historique?._id]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await getScheduledCallsByHistorique({
        rootHistoriqueId: historique._id,
      });
      setRootAudio(res?.data?.rootPathRecord || historique?.pathRecord || "");
      setCalls(res?.data?.data || []);
    } catch (err) {
      console.error(err);
      showToast?.("Erreur chargement des rappels", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async ({ scheduledAt, reason, notes, timeZone }) => {
    setAdding(true);
    try {
      await createScheduledCall({
        historiqueId: historique._id,
        reason,
        scheduledAt,
        notes,
        timeZone,
      });
      showToast?.("Rappel créé avec succès", "success");
      setShowAdd(false);
      await loadAll(); // recharge pour avoir les données enrichies
    } catch (err) {
      console.error(err);
      showToast?.("Erreur lors de la création", "danger");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteScheduledCall(id);
      setCalls((prev) => prev.filter((c) => c._id !== id));
      showToast?.("Rappel supprimé", "success");
    } catch {
      showToast?.("Erreur lors de la suppression", "danger");
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const res = await updateScheduledCall(id, data);
      const updated = res?.data?.data || res?.data;
      setCalls((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, ...updated, _pathRecord: c._pathRecord } : c,
        ),
      );
      showToast?.("Rappel mis à jour", "success");
    } catch {
      showToast?.("Erreur lors de la mise à jour", "danger");
    }
  };

  const filtered =
    filter === "all" ? calls : calls.filter((c) => c.status === filter);

  const counts = {
    all: calls.length,
    pending: calls.filter((c) => c.status === "pending").length,
    running: calls.filter((c) => c.status === "running").length,
    done: calls.filter((c) => c.status === "done").length,
    failed: calls.filter((c) => c.status === "failed").length,
  };

  if (!open) return null;

  return (
    <>
      <div className="scd-overlay" onClick={onClose} />

      <aside className="scd-drawer">
        {/* ══ HEADER ══════════════════════════════════════ */}
        <div className="scd-header">
          <div className="scd-header-top">
            <div className="scd-header-title">
              <div className="scd-header-icon">
                <i className="bi bi-clock-history" />
              </div>
              <div>
                <h2>Rappels planifiés</h2>
                <p className="scd-mono">
                  {historique?.fiche?.nom || ""}{" "}
                  {historique?.calledNumber || ""}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {/* Bouton Ajouter */}
              <button
                className={`scd-add-btn ${showAdd ? "scd-add-btn--active" : ""}`}
                onClick={() => setShowAdd((v) => !v)}
                title={showAdd ? "Annuler" : "Ajouter un rappel"}
              >
                <i className={`bi ${showAdd ? "bi-x-lg" : "bi-plus-lg"}`} />
                <span>{showAdd ? "Annuler" : "Ajouter"}</span>
              </button>
              <button
                className="scd-close"
                onClick={onClose}
                aria-label="Fermer"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
          </div>

          {/* Formulaire d'ajout (collapsible) */}
          {showAdd && (
            <AddCallForm
              historique={historique}
              onAdd={handleAdd}
              onCancel={() => setShowAdd(false)}
              saving={adding}
            />
          )}

          {/* Audio appel d'origine */}
          {!showAdd && (
            <div className="scd-root-audio">
              <div className="scd-root-audio-label">
                <i className="bi bi-telephone-fill" />
                <span>Appel d'origine</span>
                <span className="scd-root-audio-date">
                  <span
                    title={historique?.timeZone || "Europe/Paris"}
                    style={{ marginRight: 4 }}
                  >
                    {getTimeZoneFlag(historique?.timeZone)}
                  </span>
                  {formatDateTime(historique?.callDate, historique?.timeZone)}
                </span>
              </div>
              <AudioBlock pathRecord={rootAudio} />
            </div>
          )}

          {/* Tabs filtre */}
          {!showAdd && (
            <div className="scd-stats">
              {[
                { key: "all", label: "Tous", color: "" },
                {
                  key: "pending",
                  label: "En attente",
                  color: "scd-stat--warning",
                },
                { key: "done", label: "Terminés", color: "scd-stat--success" },
                { key: "failed", label: "Échecs", color: "scd-stat--danger" },
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  className={`scd-stat ${color} ${filter === key ? "scd-stat--active" : ""}`}
                  onClick={() => setFilter(key)}
                >
                  <span className="scd-stat-num">{counts[key]}</span>
                  <span className="scd-stat-label">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ══ BODY ════════════════════════════════════════ */}
        <div className="scd-body">
          {loading ? (
            <div className="scd-loading">
              <i className="bi bi-arrow-repeat scd-spin" />
              <span>Chargement…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="scd-empty">
              <i className="bi bi-calendar-x" />
              <p>
                Aucun rappel
                {filter !== "all" ? ` « ${STATUS_CONFIG[filter]?.label} »` : ""}
              </p>
              {filter !== "all" ? (
                <button
                  className="scd-btn-link"
                  onClick={() => setFilter("all")}
                >
                  Voir tous les rappels
                </button>
              ) : (
                <button
                  className="scd-btn-link"
                  onClick={() => setShowAdd(true)}
                >
                  <i className="bi bi-plus-circle" /> Créer le premier rappel
                </button>
              )}
            </div>
          ) : (
            <div className="scd-list">
              {filtered.map((call, idx) => (
                <div key={call._id}>
                  <div className="scd-item-header">
                    <span className="scd-item-index">#{idx + 1}</span>
                    <span className="scd-item-date">
                      {formatDateTime(call.scheduledAt, call.timeZone)}
                    </span>
                  </div>
                  <CallCard
                    call={call}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ FOOTER ══════════════════════════════════════ */}
        <div className="scd-footer">
          <button
            className="scd-btn-refresh"
            onClick={loadAll}
            disabled={loading}
          >
            <i
              className={`bi bi-arrow-clockwise ${loading ? "scd-spin" : ""}`}
            />
            Actualiser
          </button>
        </div>
      </aside>
    </>
  );
}
