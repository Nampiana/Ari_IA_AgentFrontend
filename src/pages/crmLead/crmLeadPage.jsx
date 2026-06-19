import React, { useEffect, useMemo, useState } from "react";
import HeaderBar from "../../components/agents/HeaderBar";
import useCrmLead from "../../hooks/useCrmLead";
import "../../assets/css/CrmLeadPage.css";

// ── Colonnes du Section — mêmes codes couleur que les badges de qualification
// crmStatus : 1 = confirmé, 2 = non confirmé, 3 = à relancer
const COLUMNS = [
  {
    key: 3,
    title: "Client potentiel",
    color: "#2563eb",
    bg: "#dbeafe",
    icon: "bi-arrow-repeat",
  },
  {
    key: 1,
    title: "Confirmé",
    color: "#16a34a",
    bg: "#dcfce7",
    icon: "bi-check-circle-fill",
  },

  {
    key: 2,
    title: "Non confirmé",
    color: "#6b7280",
    bg: "#f3f4f6",
    icon: "bi-x-circle-fill",
  },
];

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Paris",
  });
};

// ── Carte individuelle d'un lead ─────────────────────────────────────────────
function LeadCard({ lead, onDragStart, onOpen, onArchive }) {
  return (
    <div
      className="crmCard"
      draggable
      onDragStart={(e) => onDragStart(e, lead._id)}
      onClick={() => onOpen(lead)}
    >
      <div className="crmCardHeader">
        <span className="crmCardName">
          <i className="bi bi-person-fill me-1" />
          {lead.nom || "Sans nom"}
        </span>
        {lead.callbackDate && (
          <span className="crmCardBadgeDate">
            <i className="bi bi-calendar-event me-1" />
            {formatDate(lead.callbackDate)}
          </span>
        )}
        {/* Icon pour archiver */}

        <i
          className="bi bi-archive"
          onClick={(e) => {
            e.stopPropagation();
            onArchive(lead);
          }}
          style={{ cursor: "pointer" }}
        />
      </div>

      <div className="crmCardPhone">
        <i className="bi bi-telephone-fill me-1" />
        {lead.telephone || "-"}
      </div>

      {lead.entreprise && (
        <div className="crmCardCompany">
          <i className="bi bi-building me-1" />
          {lead.entreprise}
        </div>
      )}

      {lead.note && <div className="crmCardNote">{lead.note}</div>}

      <div className="crmCardFooter">
        <span className="crmCardCampagne">
          <i className="bi bi-megaphone me-1" />
          {lead.campagneId?.nomCompagne || "Campagne"}
        </span>
        {lead.assignedTo && (
          <span className="crmCardAssigned">{lead.assignedTo}</span>
        )}
      </div>
    </div>
  );
}

// ── Modal de détail / édition d'un lead ──────────────────────────────────────
function LeadDetailModal({ lead, onClose, onSave, showToast }) {
  const [crmStatus, setCrmStatus] = useState(lead?.crmStatus ?? 3);
  const [note, setNote] = useState(lead?.note ?? "");
  const [callbackDate, setCallbackDate] = useState(
    lead?.callbackDate ? lead.callbackDate.slice(0, 10) : "",
  );
  const [callbackTime, setCallbackTime] = useState(
    lead?.callbackDate ? lead.callbackDate.slice(11, 16) : "",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCrmStatus(lead?.crmStatus ?? 3);
    setNote(lead?.note ?? "");
    setCallbackDate(lead?.callbackDate ? lead.callbackDate.slice(0, 10) : "");
  }, [lead]);

  if (!lead) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(lead._id, {
        crmStatus,
        note,
        callbackDate: callbackDate || null,
        callbackTime: callbackTime || null,
      });
      showToast?.("Lead mis à jour", "success");
      onClose();
    } catch {
      showToast?.("Erreur lors de la mise à jour", "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="crmModalOverlay" onClick={onClose}>
      <div className="crmModalContent" onClick={(e) => e.stopPropagation()}>
        <div className="crmModalHeader">
          <h3>
            <i className="bi bi-person-badge me-2" />
            {lead.nom || "Sans nom"}
          </h3>
          <button className="crmModalClose" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="crmModalBody">
          <div className="crmModalRow">
            <i className="bi bi-telephone-fill" />
            <span>{lead.telephone || "-"}</span>
          </div>
          {lead.email && (
            <div className="crmModalRow">
              <i className="bi bi-envelope-fill" />
              <span>{lead.email}</span>
            </div>
          )}
          {lead.entreprise && (
            <div className="crmModalRow">
              <i className="bi bi-building" />
              <span>{lead.entreprise}</span>
            </div>
          )}
          <div className="crmModalRow">
            <i className="bi bi-megaphone" />
            <span>{lead.campagneId?.nomCompagne || "Campagne"}</span>
          </div>

          <div className="crmModalDivider" />

          <label className="crmModalLabel">Qualification CRM</label>
          <div className="crmModalStatusGroup">
            {COLUMNS.map((col) => (
              <button
                key={col.key}
                type="button"
                className={`crmStatusBtn ${crmStatus === col.key ? "active" : ""}`}
                style={{
                  borderColor:
                    crmStatus === col.key ? col.color : "transparent",
                  background: col.bg,
                  color: col.color,
                }}
                onClick={() => setCrmStatus(col.key)}
              >
                <i className={`bi ${col.icon} me-1`} />
                {col.title}
              </button>
            ))}
          </div>

          <label className="crmModalLabel">Date de rappel</label>
          <input
            type="date"
            className="crmModalInput"
            value={callbackDate}
            onChange={(e) => setCallbackDate(e.target.value)}
          />

          <label className="crmModalLabel">Heure de rappel</label>
          <input
            type="time"
            className="crmModalInput"
            value={callbackTime}
            onChange={(e) => setCallbackTime(e.target.value)}
          />

          <label className="crmModalLabel">Note</label>
          <textarea
            className="crmModalTextarea"
            rows={4}
            value={note}
            placeholder="Ajouter une note sur ce lead…"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="crmModalFooter">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function CrmLeadPage({ showToast }) {
  const { getCrmLeads, updateCrmLead } = useCrmLead();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalArchive, setModalArchive] = useState(false);
  const [selectedLeadArchive, setSelectedLeadArchive] = useState(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      const res = await getCrmLeads(params);
      setLeads(res?.data?.data || []);
    } catch {
      showToast?.("Erreur chargement des leads CRM", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeads();
    setIsRefreshing(false);
  };

  const handleSaveLead = async (id, payload) => {
    await updateCrmLead(id, payload);
    setLeads((prev) =>
      prev.map((l) => (l._id === id ? { ...l, ...payload } : l)),
    );
  };

  // ── Drag & drop entre colonnes ────────────────────────────────────────────
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("leadId", id);
  };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    setDragOverCol(colKey);
  };

  const handleDrop = async (e, colKey) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData("leadId");
    if (!id) return;

    const lead = leads.find((l) => l._id === id);
    if (!lead || lead.crmStatus === colKey) return;

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l._id === id ? { ...l, crmStatus: colKey } : l)),
    );

    try {
      await updateCrmLead(id, { crmStatus: colKey });
      showToast?.("Lead déplacé", "success");
    } catch {
      showToast?.("Erreur lors du déplacement", "danger");
      fetchLeads(); // rollback en cas d'échec
    }
  };

  const leadsByColumn = useMemo(() => {
    const grouped = { 1: [], 2: [], 3: [] };
    leads.forEach((lead) => {
      const key = lead.crmStatus ?? 3;
      if (grouped[key]) grouped[key].push(lead);
    });
    return grouped;
  }, [leads]);

  const handlebtnArchive = (lead) => {
    setSelectedLeadArchive(lead);
    setModalArchive(true);
  };

  const handleArchiveLead = async () => {
    try {
      await updateCrmLead(selectedLeadArchive._id, { isArchived: true });
      setLeads((prev) => prev.filter((l) => l._id !== selectedLeadArchive._id));
      showToast?.("Lead archivé", "success");
      setModalArchive(false);
      setSelectedLeadArchive(null);
    } catch {
      showToast?.("Erreur lors de l'archivage", "danger");
    }
  };

  return (
    <>
      <div className="crmSectionPage">
        <HeaderBar />

        <div className="crmSectionContainer">
          {/* En-tête */}
          <div className="crmSectionHeader">
            <div>
              <h1>CRM — Leads réussis</h1>
              <p>Qualifiez et suivez les leads issus des appels IA réussis.</p>
            </div>

            <div className="crmSectionActions">
              <div className="crmSectionSearch">
                <i className="bi bi-search" />
                <input
                  type="text"
                  placeholder="Rechercher un nom, numéro…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <i
                  className={`bi bi-arrow-clockwise ${isRefreshing ? "spin" : ""}`}
                />
                {isRefreshing ? "Actualisation…" : "Actualiser"}
              </button>
            </div>
          </div>

          {/* Colonnes Section */}
          {loading ? (
            <div className="crmSectionEmpty">Chargement des leads…</div>
          ) : (
            <div className="crmSectionBoard">
              {COLUMNS.map((col) => (
                <div
                  key={col.key}
                  className={`crmSectionColumn ${dragOverCol === col.key ? "dragOver" : ""}`}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => handleDrop(e, col.key)}
                >
                  <div
                    className="crmSectionColumnHeader"
                    style={{ borderColor: col.color }}
                  >
                    <span
                      className="crmSectionColumnTitle"
                      style={{ color: col.color }}
                    >
                      <i className={`bi ${col.icon} me-2`} />
                      {col.title}
                    </span>
                    <span
                      className="crmSectionColumnCount"
                      style={{ background: col.color }}
                    >
                      {leadsByColumn[col.key]?.length ?? 0}
                    </span>
                  </div>

                  <div className="crmSectionColumnBody">
                    {leadsByColumn[col.key]?.length === 0 ? (
                      <div className="crmSectionColumnEmpty">Aucun lead</div>
                    ) : (
                      leadsByColumn[col.key].map((lead) => (
                        <LeadCard
                          key={lead._id}
                          lead={lead}
                          onDragStart={handleDragStart}
                          onOpen={setSelectedLead}
                          onArchive={handlebtnArchive}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={handleSaveLead}
          showToast={showToast}
        />
      </div>
      {/* Modal de confirmation pour archiver */}
      {modalArchive && (
        <div className="modal" tabIndex="-1" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmer l'archivage</h5>
              </div>
              <div className="modal-body">
                <p>Êtes-vous sûr de vouloir archiver ce lead ?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalArchive(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleArchiveLead}
                >
                  Archiver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
