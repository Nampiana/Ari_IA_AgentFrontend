import React from "react";

export default function CompagneCard({
  compagne,
  onEdit,
  onDelete,
  lancerCampagne,
  onQualifications,
  onToggleBackgroundNoise,
}) {
  const isInbound = compagne.callType === "inbound";

  return (
    <div className="compagneCard">
      <div className="compagneCardTop">
        <div>
          <h3 className="compagneName">{compagne.nomCompagne}</h3>
          <div className="compagneNumero">{compagne.numero}</div>
          <div className="compagneBadges">
            {/* Statut actif/inactif */}
            <span className={`badge ${compagne.active === 1 ? "success" : "danger"}`}>
              {compagne.active === 1 ? "Actif" : "Inactif"}
            </span>
            {!isInbound && (
              <span
                className={`badge ${compagne.backgroundNoise ? "success" : "danger"}`}
              >
                <i className={`bi ${compagne.backgroundNoise ? "bi-volume-up-fill" : "bi-volume-mute-fill"}`} />
                {" "}
                {compagne.backgroundNoise ? "Fond actif" : "Fond off"}
              </span>
            )}

            {/* ✅ Type d'appel */}
            <span className={`badge ${isInbound ? "badgeInbound" : "badgeOutbound"}`}>
              <i className={`bi ${isInbound ? "bi-telephone-inbound-fill" : "bi-telephone-outbound-fill"}`} />
              {" "}{isInbound ? "Entrant" : "Sortant"}
            </span>

            {/* Appels simultanés */}
            <span className={`badge ${compagne.maxConcurrentCalls > 1 ? "badgeConcurrent" : "badgeSeq"}`}>
              <i className="bi bi-telephone-fill" style={{ color: "#10b981" }} />
              <span style={{ color: "#10b981" }}>×{compagne.maxConcurrentCalls ?? 1}</span>
            </span>
          </div>
        </div>

        <div className="compagneStatusWrap">
          {/* Bouton Lancer/Arrêter — masqué pour l'entrant (pas de dialer) */}
          {!isInbound && (
            <button
              type="button"
              className={`btnAction ${compagne.isRunning === 1 ? "btnStop" : "btnStart"}`}
              onClick={() => lancerCampagne(compagne)}
            >
              <i className={`bi ${compagne.isRunning === 1 ? "bi-stop-fill" : "bi-play-fill"}`} />
              {compagne.isRunning === 1 ? " Arrêter" : " Lancer"}
            </button>
          )}
          <button
            type="button"
            className="btnCardAction"
            onClick={() => onQualifications(compagne)}
          >
            <i className="bi bi-tags" /> Qualifications
          </button>

          {!isInbound && (
            <button
              type="button"
              className="btnCardAction"
              onClick={() => onToggleBackgroundNoise(compagne)}
            >
              <i
                className={`bi ${compagne.backgroundNoise
                    ? "bi-volume-up-fill"
                    : "bi-volume-mute-fill"
                  }`}
              />
              {" "}
              {compagne.backgroundNoise ? "Fond ON" : "Fond OFF"}
            </button>
          )}
          <button type="button" className="btnEdit" onClick={() => onEdit(compagne)}>
            Modifier
          </button>
          <button type="button" className="btnDelete" onClick={() => onDelete(compagne._id)}>
            Supprimer
          </button>
        </div>
      </div>

      <div className="compagneMetaGrid">
        <div>
          <span className="label">Numéro</span>
          <div>{compagne.numero || "-"}</div>
        </div>

        {/* ✅ Type d'appel dans la grille */}
        <div>
          <span className="label">Type d'appel</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i
              className={`bi ${isInbound ? "bi-telephone-inbound-fill" : "bi-telephone-outbound-fill"}`}
              style={{ color: isInbound ? "#6366f1" : "#f59e0b" }}
            />
            {isInbound ? "Entrant" : "Sortant"}
          </div>
        </div>

        {/* Fiches — uniquement utiles en sortant */}
        {!isInbound && (
          <div>
            <span className="label">Fiches</span>
            <div>
              {compagne.fiches?.length
                ? compagne.fiches.map((f) => f.nomFiche).join(", ")
                : "Non définies"}
            </div>
          </div>
        )}

        <div>
          <span className="label">Agent IA</span>
          <div>{compagne.id_ia?.nomAgent || "Non défini"}</div>
        </div>

        {/* Timeout — uniquement en sortant */}
        {!isInbound && (
          <div>
            <span className="label">Timeout</span>
            <div>{compagne.dialTimeout ?? 30}s</div>
          </div>
        )}

        {/* Stats appels — uniquement en sortant */}
        {!isInbound && (
          <>
            <div>
              <span className="label">Appels disponibles</span>
              <div>{compagne.callStats?.appelsDisponibles ?? 0}</div>
            </div>
            <div>
              <span className="label">Fiches disponibles</span>
              {compagne.callStats?.parListe?.length > 0 ? (
                <div className="formHint">
                  {compagne.callStats.parListe.map((l) => (
                    <div key={l.listId}>
                      {l.nomFiche} : {l.disponible} disponible(s) sur {l.total}
                    </div>
                  ))}
                </div>
              ) : (
                <div>0</div>
              )}
            </div>
          </>
        )}

        <div>
          <span className="label">Appels simultanés</span>
          <div className="concurrentDisplay">
            <i className="bi bi-telephone-fill concurrentDot" />
            <span className="concurrentCount">{compagne.maxConcurrentCalls ?? 1}</span>
          </div>
        </div>

        <div>
          <span className="label">Jours autorisés</span>
          <div>
            {compagne.allowedDays?.length
              ? compagne.allowedDays
                .map((d) => ({ 0: "Dim", 1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam" }[d]))
                .join(", ")
              : "Lun - Ven"}
          </div>
        </div>

        <div>
          <span className="label">Horaires</span>
          <div>
            {compagne.startHour || "08:00"} - {compagne.endHour || "21:00"}
          </div>
        </div>

        <div>
          <span className="label">Fuseau</span>
          <div>{compagne.timeZone || "Europe/Paris"}</div>
        </div>
      </div>

      <div className="compagneScriptBlock">
        <span className="label">Script final</span>
        <p>{compagne.scriptFinal || compagne.script}</p>
      </div>
    </div>
  );
}