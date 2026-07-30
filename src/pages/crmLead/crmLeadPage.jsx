import React, { useEffect, useMemo, useState } from "react";
import HeaderBar from "../../components/agents/HeaderBar";
import useCrmLead from "../../hooks/useCrmLead";
import "../../assets/css/CrmLeadPage.css";

// ── Colonnes du board — les couleurs réutilisent les tokens de
// qualification déjà en place sur la page Historique (--hist-*),
// pour que le code couleur d'un même statut reste identique dans
// tout le produit.
// crmStatus : 1 = confirmé, 2 = non confirmé, 3 = à relancer
const COLUMNS = [
  {
    key: 3,
    title: "Client potentiel",
    color: "var(--hist-info)",
    bg: "var(--hist-info-soft)",
    icon: "bi-arrow-repeat",
  },
  {
    key: 1,
    title: "Confirmé",
    color: "var(--hist-success)",
    bg: "var(--hist-success-soft)",
    icon: "bi-check-circle-fill",
  },
  {
    key: 2,
    title: "Non confirmé",
    color: "var(--hist-gray)",
    bg: "var(--hist-gray-soft)",
    icon: "bi-x-circle-fill",
  },
];

const getColumn = (key) => COLUMNS.find((c) => c.key === key) || COLUMNS[0];

function getInitials(nom) {
  if (!nom) return "SN";
  return nom
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

function buildRecordUrl(pathRecord) {
  if (!pathRecord) return "";
  if (pathRecord.startsWith("http://") || pathRecord.startsWith("https://"))
    return pathRecord;
  const base = (
    process.env.REACT_APP_HOST_API || "http://localhost:4000/api/v1/"
  )
    .replace("/api/v1/", "")
    .replace(/\/$/, "");
  return `${base}/files/${pathRecord}`;
}

function formatDateTime(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function LeadCard({ lead, onDragStart, onDragEnd, onOpen, onArchive }) {
  const recordUrl = buildRecordUrl(lead.historiqueId?.pathRecord);
  const displayNom = lead.nom || lead.fiche?.nom || "Sans nom";
  const displayTelephone = lead.telephone || lead.fiche?.phone || "-";
  const stage = getColumn(lead.crmStatus ?? 3);

  return (
    <div
      className="crmCard"
      style={{ "--stage-color": stage.color, "--stage-soft": stage.bg }}
      draggable
      onDragStart={(e) => onDragStart(e, lead._id)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(lead)}
    >
      <div className="crmCardHeader">
        <div className="crmCardAvatar">{getInitials(displayNom)}</div>
        <span className="crmCardName">{displayNom}</span>
        {lead.callbackDate && (
          <span className="crmCardBadgeDate">
            <i className="bi bi-calendar-event" />
            {formatDate(lead.callbackDate)}
          </span>
        )}
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
        {lead?.historiqueId?.typeCall == 2 ? (
          <i
            className="bi bi-telephone-inbound-fill"
            style={{ color: "var(--hist-success)" }}
          />
        ) : (
          <i
            className="bi bi-telephone-outbound-fill"
            style={{ color: "var(--crm-accent)" }}
          />
        )}
        <span>{displayTelephone}</span>
      </div>

      {(lead.entreprise || lead.fiche?.entreprise) && (
        <div className="crmCardCompany">
          <i className="bi bi-building me-1" />
          {lead.entreprise || lead.fiche?.entreprise}
        </div>
      )}

      {/* ── Date de qualification (appel d'origine) ── */}
      {lead.historiqueId?.callDate && (
        <div className="crmCardQualifDate">
          <i className="bi bi-clock-history me-1" />
          Qualifié le {formatDateTime(lead.historiqueId.callDate)}
        </div>
      )}

      {lead.note && <div className="crmCardNote">{lead.note}</div>}

      {/* ── Audio de l'appel ── */}
      <div className="crmCardAudio" onClick={(e) => e.stopPropagation()}>
        {recordUrl ? (
          <audio controls className="crmCardAudioPlayer">
            <source src={recordUrl} />
            Votre navigateur ne supporte pas l'audio.
          </audio>
        ) : (
          <span className="crmCardNoAudio">
            <i className="bi bi-volume-mute me-1" />
            Pas d'enregistrement
          </span>
        )}
      </div>

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
  const [dateTimeTouched, setDateTimeTouched] = useState(false);

  useEffect(() => {
    setCrmStatus(lead?.crmStatus ?? 3);
    setNote(lead?.note ?? "");
    setCallbackDate(lead?.callbackDate ? lead.callbackDate.slice(0, 10) : "");
    setDateTimeTouched(false);
  }, [lead]);

  if (!lead) return null;
  const recordUrl = buildRecordUrl(lead.historiqueId?.pathRecord);
  const isDateTimeIncomplete =
    dateTimeTouched && (!callbackDate || !callbackTime);
  const canSave = !isDateTimeIncomplete;

  const displayNom = lead.nom || lead.fiche?.nom || "Sans nom";
  const displayTelephone = lead.telephone || lead.fiche?.phone || "-";
  const displayEmail = lead.email || lead.fiche?.email;
  const displayEntreprise = lead.entreprise || lead.fiche?.entreprise;
  const displayAdresse = lead.fiche?.adresse;
  const displayVille = lead.fiche?.ville;

  const handleDateChange = (e) => {
    setCallbackDate(e.target.value);
    setDateTimeTouched(true);
  };

  const handleTimeChange = (e) => {
    setCallbackTime(e.target.value);
    setDateTimeTouched(true);
  };

  const handleSave = async () => {
    if (!canSave) return;
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
    } catch (error) {
      showToast?.("La date de rappel doit être dans le futur", "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="crmModalOverlay" onClick={onClose}>
      <div className="crmModalContent" onClick={(e) => e.stopPropagation()}>
        <div className="crmModalHeader">
          <h3>
            <i className="bi bi-person-badge" />
            {displayNom}
          </h3>
          <button className="crmModalClose" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="crmModalBody">
          {lead.historiqueId && (
            <div className="crmModalCallOrigin">
              <div className="crmModalCallOriginHeader">
                {lead?.historiqueId?.typeCall == 2 ? (
                  <i className="bi bi-telephone-inbound-fill" />
                ) : (
                  <i className="bi bi-telephone-outbound-fill" />
                )}
                <span>Appel d'origine</span>
                <span className="crmModalCallOriginDate">
                  {formatDateTime(lead.historiqueId.callDate)}
                </span>
                <span className="crmModalCallOriginDuration">
                  ({displayTelephone})
                </span>
              </div>
              {recordUrl ? (
                <audio controls className="crmModalAudioPlayer">
                  <source src={recordUrl} />
                  Votre navigateur ne supporte pas l'audio.
                </audio>
              ) : (
                <span className="crmCardNoAudio">
                  <i className="bi bi-volume-mute me-1" />
                  Pas d'enregistrement
                </span>
              )}
            </div>
          )}
          {displayTelephone && (
            <div className="crmModalRow">
              <i className="bi bi-telephone-fill" />
              <span>{displayTelephone}</span>
            </div>
          )}
          {displayEmail && (
            <div className="crmModalRow">
              <i className="bi bi-envelope-fill" />
              <span>{displayEmail}</span>
            </div>
          )}
          {displayEntreprise && (
            <div className="crmModalRow">
              <i className="bi bi-building" />
              <span>{displayEntreprise}</span>
            </div>
          )}
          {displayAdresse && (
            <div className="crmModalRow">
              <i className="bi bi-geo-alt-fill" />
              <span>
                {displayAdresse}
                {displayVille ? `, ${displayVille}` : ""}
              </span>
            </div>
          )}
          <div className="crmModalRow">
            <i className="bi bi-megaphone" />
            <span>{lead.campagneId?.nomCompagne || "Campagne"}</span>
          </div>

          <div className="crmModalDivider" />

          {lead.crmStatus === 2 && (
            <>
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

              <label className="crmModalLabel">
                Date de rappel
                {dateTimeTouched && (
                  <span className="crmModalRequired"> *</span>
                )}
              </label>
              <input
                type="date"
                className={`crmModalInput ${isDateTimeIncomplete && !callbackDate ? "crmModalInput--error" : ""}`}
                value={callbackDate}
                onChange={handleDateChange}
              />

              <label className="crmModalLabel">
                Heure de rappel
                {dateTimeTouched && (
                  <span className="crmModalRequired"> *</span>
                )}
              </label>
              <input
                type="time"
                className={`crmModalInput ${isDateTimeIncomplete && !callbackTime ? "crmModalInput--error" : ""}`}
                value={callbackTime}
                onChange={handleTimeChange}
              />

              {isDateTimeIncomplete && (
                <div className="crmModalWarning">
                  <i className="bi bi-exclamation-triangle-fill me-1" />
                  Veuillez renseigner à la fois la date et l'heure du rappel.
                </div>
              )}
            </>
          )}

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
          <button className="btnGhost" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btnPrimary"
            onClick={handleSave}
            disabled={saving || !canSave}
            title={!canSave ? "Complétez la date et l'heure du rappel" : ""}
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
  const { getCrmLeads, updateCrmLead, reorderCrmLeads } = useCrmLead();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dragOverCardId, setDragOverCardId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalArchive, setModalArchive] = useState(false);
  const [selectedLeadArchive, setSelectedLeadArchive] = useState(null);
  const [archiving, setArchiving] = useState(false);

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
    setDraggedId(id);
    e.dataTransfer.setData("leadId", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCardId(null);
    setDragOverCol(null);
  };

  // Survol d'une carte précise → marque la position d'insertion
  const handleCardDragOver = (e, cardId) => {
    e.preventDefault();
    e.stopPropagation();
    if (cardId !== draggedId) setDragOverCardId(cardId);
  };

  const handleColumnDragOver = (e, colKey) => {
    e.preventDefault();
    setDragOverCol(colKey);
  };

  const handleDrop = async (e, colKey, dropOnCardId = null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCol(null);
    setDragOverCardId(null);

    const id = e.dataTransfer.getData("leadId");
    if (!id) return;

    const draggedLead = leads.find((l) => l._id === id);
    if (!draggedLead) return;

    // ── Construit la nouvelle liste ordonnée pour la colonne cible ──────────
    setLeads((prev) => {
      // Retire la carte déplacée de sa position actuelle
      const without = prev.filter((l) => l._id !== id);

      // Cartes actuelles de la colonne cible (déjà triées par leur ordre actuel)
      const colLeads = without.filter((l) => (l.crmStatus ?? 3) === colKey);
      const otherLeads = without.filter((l) => (l.crmStatus ?? 3) !== colKey);

      const movedLead = { ...draggedLead, crmStatus: colKey };

      let newColLeads;
      if (dropOnCardId) {
        // Insère juste avant la carte ciblée
        const idx = colLeads.findIndex((l) => l._id === dropOnCardId);
        newColLeads = [
          ...colLeads.slice(0, idx),
          movedLead,
          ...colLeads.slice(idx),
        ];
      } else {
        // Déposé sur la colonne (pas sur une carte précise) → à la fin
        newColLeads = [...colLeads, movedLead];
      }

      // Réassigne un "order" local pour le rendu (sera confirmé par le backend)
      newColLeads.forEach((l, i) => {
        l.order = i;
      });

      return [...otherLeads, ...newColLeads];
    });

    // ── Persistance backend ───────────────────────────────────────────────────
    try {
      // Si changement de colonne, on met à jour le statut du lead déplacé
      if (draggedLead.crmStatus !== colKey) {
        await updateCrmLead(id, { crmStatus: colKey });
      }

      // Recalcule l'ordre final de la colonne cible et l'envoie au backend
      setLeads((current) => {
        const finalColIds = current
          .filter((l) => (l.crmStatus ?? 3) === colKey)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((l) => l._id);

        reorderCrmLeads(colKey, finalColIds).catch(() => {
          showToast?.("Erreur lors de la réorganisation", "danger");
        });

        return current;
      });

      showToast?.("Lead déplacé", "success");
    } catch {
      showToast?.("Erreur lors du déplacement", "danger");
      fetchLeads(); // rollback complet en cas d'échec
    }
  };

  const leadsByColumn = useMemo(() => {
    const grouped = { 1: [], 2: [], 3: [] };
    leads.forEach((lead) => {
      const key = lead.crmStatus ?? 3;
      if (grouped[key]) grouped[key].push(lead);
    });
    // Trie chaque colonne par order
    Object.keys(grouped).forEach((k) => {
      grouped[k].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
    return grouped;
  }, [leads]);

  const handlebtnArchive = (lead) => {
    setSelectedLeadArchive(lead);
    setModalArchive(true);
  };

  const handleArchiveLead = async () => {
    try {
      setArchiving(true);
      await updateCrmLead(selectedLeadArchive._id, { isArchived: true });
      setLeads((prev) => prev.filter((l) => l._id !== selectedLeadArchive._id));
      showToast?.("Lead archivé", "success");
      setModalArchive(false);
      setSelectedLeadArchive(null);
    } catch {
      showToast?.("Erreur lors de l'archivage", "danger");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <>
      <div className="crmSectionPage">
        <HeaderBar />

        <div className="crmSectionContainer">
          {/* ── Hero ── */}
          <section className="crmHero">
            <div className="crmHero__text">
              <span className="crmHero__eyebrow">
                <span className="crmHero__dot" />
                Suivi commercial
              </span>
              <h1>Leads CRM</h1>
              <p>
                Qualifiez, relancez et suivez les leads issus des appels IA
                réussis, du premier contact jusqu'à la confirmation.
              </p>
            </div>

            <div className="crmHero__legend">
              {COLUMNS.map((col) => (
                <div
                  key={col.key}
                  className="crmLegendStat"
                  style={{ "--stage-color": col.color }}
                >
                  <span className="crmLegendStat__value">
                    {leadsByColumn[col.key]?.length ?? 0}
                  </span>
                  <span className="crmLegendStat__label">
                    <i className="bi bi-circle-fill" />
                    {col.title}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Barre de contrôle ── */}
          <div className="crmSectionHeader">
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
                className="crmRefreshBtn"
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

          {/* ── Board ── */}
          {loading ? (
            <div className="crmSectionEmpty">Chargement des leads…</div>
          ) : (
            <div className="crmSectionBoard">
              {COLUMNS.map((col) => (
                <div
                  key={col.key}
                  className={`crmSectionColumn ${dragOverCol === col.key ? "dragOver" : ""}`}
                  style={{ "--stage-color": col.color, "--stage-soft": col.bg }}
                  onDragOver={(e) => handleColumnDragOver(e, col.key)}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => handleDrop(e, col.key)} // drop sur zone vide de colonne = fin de liste
                >
                  <div className="crmSectionColumnHeader">
                    <div
                      className="crmSectionColumnIcon"
                      style={{ background: col.bg, color: col.color }}
                    >
                      <i className={`bi ${col.icon}`} />
                    </div>
                    <span
                      className="crmSectionColumnTitle"
                      style={{ color: col.color }}
                    >
                      {col.title}
                    </span>
                    <span
                      className="crmSectionColumnCount"
                      style={{ background: col.bg, color: col.color }}
                    >
                      {leadsByColumn[col.key]?.length ?? 0}
                    </span>
                  </div>

                  <div className="crmSectionColumnBody">
                    {leadsByColumn[col.key]?.length === 0 ? (
                      <div className="crmSectionColumnEmpty">Aucun lead</div>
                    ) : (
                      leadsByColumn[col.key].map((lead) => (
                        <div
                          key={lead._id}
                          className={`crmCardWrapper ${dragOverCardId === lead._id ? "crmCardWrapper--dragOver" : ""} ${draggedId === lead._id ? "crmCardWrapper--dragging" : ""}`}
                          onDragOver={(e) => handleCardDragOver(e, lead._id)}
                          onDrop={(e) => handleDrop(e, col.key, lead._id)}
                        >
                          <LeadCard
                            lead={lead}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onOpen={setSelectedLead}
                            onArchive={handlebtnArchive}
                          />
                        </div>
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

      {/* ── Confirmation d'archivage ── */}
      {modalArchive && (
        <div className="deleteModalOverlay">
          <div className="deleteModal crmArchiveModal">
            <div className="crmArchiveIcon">
              <i className="bi bi-archive" />
            </div>
            <h3>Archiver ce lead</h3>
            <p>
              Voulez-vous vraiment archiver{" "}
              <strong>
                {selectedLeadArchive?.nom ||
                  selectedLeadArchive?.fiche?.nom ||
                  "ce lead"}
              </strong>{" "}
              ? Il sera retiré du board mais restera consultable dans les
              archives.
            </p>

            <div className="deleteActions">
              <button
                className="btnGhost"
                onClick={() => setModalArchive(false)}
                disabled={archiving}
              >
                Annuler
              </button>

              <button
                className="btnDelete"
                onClick={handleArchiveLead}
                disabled={archiving}
              >
                {archiving ? "Archivage..." : "Archiver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
