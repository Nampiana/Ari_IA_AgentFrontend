import React from "react";

const formatDateFull = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return (
    d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Paris",
    }) +
    " à " +
    d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    })
  );
};

export default function EmailSentModal({ open, historique, onClose }) {
  if (!open || !historique) return null;

  const emails = historique.emails || [];

  return (
    <div
      className="modal"
      tabIndex="-1"
      style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-envelope-fill me-2" />
              Email{emails.length > 1 ? "s" : ""} envoyé
              {emails.length > 1 ? "s" : ""} au prospect
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {emails.length === 0 ? (
              <span className="text-muted">Aucun email envoyé.</span>
            ) : (
              emails.map((email, idx) => (
                <div key={idx} className={idx > 0 ? "mt-4" : ""}>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between flex-wrap gap-2 mb-2">
                      <div>
                        <strong>Destinataire :</strong>{" "}
                        {email.destinataire || "-"}
                      </div>
                      <div className="text-muted">
                        <i className="bi bi-clock me-1" />
                        Envoyé le {formatDateFull(email.dateEnvoi)}
                      </div>
                    </div>
                    <div>
                      <strong>Objet :</strong> {email.objet || "-"}
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "16px",
                      background: "#f9fafb",
                      maxHeight: "500px",
                      overflowY: "auto",
                    }}
                  >
                    {email.corps ? (
                      <div
                        // ⚠️ Le corps est un HTML de confiance (généré côté
                        // serveur à partir du template de campagne configuré
                        // par un admin), pas une saisie libre non fiable.
                        dangerouslySetInnerHTML={{ __html: email.corps }}
                      />
                    ) : (
                      <span className="text-muted">
                        Contenu de l'email non disponible.
                      </span>
                    )}
                  </div>

                  {idx < emails.length - 1 && <hr className="mt-4" />}
                </div>
              ))
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}