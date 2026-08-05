import React from "react";
import "../../assets/css/HistoriqueDetailModal.css";

const getStatusLabel = (status) => {
  const value = Number(status);

  if (value === 2) return "SALE";
  if (value === 3) return "CALLBACK";
  if (value === 4) return "OCCUPÉ";
  if (value === 1) return "NI";

  return "INCONNU";
};

// Couleurs pilotées par les tokens --hist-* (index.css), cohérentes
// avec les badges de qualification de HistoriquesPage.
const getStatusStyle = (status) => {
  const value = Number(status);

  switch (value) {
    case 2:
      return { color: "var(--hist-success)", bg: "var(--hist-success-soft)" };
    case 3:
      return { color: "var(--hist-info)", bg: "var(--hist-info-soft)" };
    case 4:
      return { color: "var(--hist-warning)", bg: "var(--hist-warning-soft)" };
    case 1:
      return { color: "var(--hist-danger)", bg: "var(--hist-danger-soft)" };
    default:
      return { color: "var(--hist-gray)", bg: "var(--hist-gray-soft)" };
  }
};

const buildRecordUrl = (pathRecord) => {
  if (!pathRecord) return "";

  if (pathRecord.startsWith("http://") || pathRecord.startsWith("https://")) {
    return pathRecord;
  }

  const base = (
    process.env.REACT_APP_HOST_API || "http://localhost:4000/api/v1/"
  )
    .replace("/api/v1/", "")
    .replace(/\/$/, "");

  return `${base}/files/${pathRecord}`;
};

const isSale = (status) => {
  return Number(status) === 2;
};

export default function HistoriqueDetailModal({ open, historique, onClose }) {
  if (!open || !historique) return null;
  const ai = historique.aiResponse || {};
  const recordUrl = buildRecordUrl(historique.pathRecord);
  const statusStyle = getStatusStyle(historique.status);

  return (
    <div className="historiqueModalOverlay" onClick={onClose}>
      <div className="historiqueModal" onClick={(e) => e.stopPropagation()}>
        <div className="historiqueModalHeader">
          <div>
            <h3>Détail de l'appel</h3>
            <span
              className="historiqueModalStatusBadge"
              style={{ color: statusStyle.color, background: statusStyle.bg }}
            >
              <i
                className="bi bi-record-circle-fill"
                style={{ fontSize: "9px" }}
              />
              {getStatusLabel(historique.status)}
            </span>
          </div>

          <button
            className="historiqueCloseBtn"
            onClick={onClose}
            aria-label="Fermer"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="historiqueModalBody">
          <p className="historiqueSectionLabel">
            <i className="bi bi-person-vcard" /> Informations de l'appel
          </p>
          <div className="historiqueDetailGrid">
            <div className="historiqueDetailItem">
              <span>Nom</span>
              <strong>{historique.fiche?.nom || "-"}</strong>
            </div>

            <div className="historiqueDetailItem">
              <span>Numéro appelé</span>
              <strong>
                {historique.fiche?.phone || historique.calledNumber || "-"}
              </strong>
            </div>

            <div className="historiqueDetailItem">
              <span>Numéro appelant</span>
              <strong>{historique.callerNumber || "-"}</strong>
            </div>

            <div className="historiqueDetailItem">
              <span>Campagne</span>
              <strong>{historique.campagneId?.nomCompagne || "-"}</strong>
            </div>

            <div className="historiqueDetailItem">
              <span>Agent</span>
              <strong>{historique.agentIaId?.nomAgent || "-"}</strong>
            </div>

            <div className="historiqueDetailItem">
              <span>Canal</span>
              <strong>{historique.channelId || "-"}</strong>
            </div>

            <div className="historiqueDetailItem">
              <span>Durée</span>
              <strong>
                {historique.billsec ?? historique.callDuration ?? 0} sec
              </strong>
            </div>

            <div className="historiqueDetailItem">
              <span>Archive</span>
              <strong>
                {historique.archive === 1 ? "Archivé" : "Non archivé"}
              </strong>
            </div>
          </div>

          <div className="historiqueResponseBox">
            <h4>Réponse IA</h4>

            {isSale(historique.status) ? (
              <div className="historiqueDetailGrid">
                <div className="historiqueDetailItem">
                  <span>Nom</span>
                  <strong>{ai.nameUser || "-"}</strong>
                </div>

                <div className="historiqueDetailItem">
                  <span>Email</span>
                  <strong>{ai.mailUser || "-"}</strong>
                </div>

                <div className="historiqueDetailItem">
                  <span>Téléphone</span>
                  <strong>{ai.phoneUser || "-"}</strong>
                </div>

                <div className="historiqueDetailItem">
                  <span>Adresse</span>
                  <strong>{ai.adresseUser || "-"}</strong>
                </div>

                <div className="historiqueDetailItem">
                  <span>Date RDV</span>
                  <strong>{ai.dateRDV || "-"}</strong>
                </div>

                <div className="historiqueDetailItem">
                  <span>Heure RDV</span>
                  <strong>{ai.heureRDV || "-"}</strong>
                </div>

                <div className="historiqueDetailItem">
                  <span>Date callback</span>
                  <strong>{ai.dateCLB || "-"}</strong>
                </div>

                <div className="historiqueDetailItem">
                  <span>Heure callback</span>
                  <strong>{ai.heureCallBack || "-"}</strong>
                </div>

                <div className="historiqueDetailItem full">
                  <span>Description</span>
                  <strong>{ai.description || "-"}</strong>
                </div>
              </div>
            ) : (
              <div className="historiqueDescriptionOnly">
                {ai?.description || "-"}
              </div>
            )}
          </div>

          <div className="historiqueRecordBox">
            <h4>Enregistrement</h4>

            {recordUrl ? (
              <audio controls className="historiqueModalAudio">
                <source src={recordUrl} />
                Votre navigateur ne supporte pas l'audio.
              </audio>
            ) : (
              <p>
                <i className="bi bi-volume-mute" />
                Aucun fichier audio disponible.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
