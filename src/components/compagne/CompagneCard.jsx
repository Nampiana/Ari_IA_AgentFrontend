import React from "react";

export default function CompagneCard({
  compagne,
  onEdit,
  onDelete,
  lancerCampagne,
}) {
  return (
    <div className="compagneCard">
      <div className="compagneCardTop">
        <div>
          <h3 className="compagneName">{compagne.nomCompagne}</h3>
          <div className="compagneNumero">{compagne.numero}</div>
          <div className="compagneBadges">
            <span className={`badge ${compagne.active === 1 ? "success" : "danger"}`}>
              {compagne.active === 1 ? "Actif" : "Inactif"}
            </span>
            <span className={`badge ${compagne.maxConcurrentCalls > 1 ? "badgeConcurrent" : "badgeSeq"}`}>
              <i className="bi bi-telephone-fill" style={{ color: "#10b981" }} />  {/* orange */}
              <span style={{ color: "#10b981" }}>×{compagne.maxConcurrentCalls ?? 1}</span>  {/* vert */}
            </span>
          </div>
        </div>

        <div className="compagneStatusWrap">
          <button
            type="button"
            className={`btnAction ${compagne.isRunning === 1 ? "btnStop" : "btnStart"}`}
            onClick={() => lancerCampagne(compagne)}
          >
            <i className={`bi ${compagne.isRunning === 1 ? "bi-stop-fill" : "bi-play-fill"}`} />
            {compagne.isRunning === 1 ? " Arrêter" : " Lancer"}
          </button>

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

        <div>
          <span className="label">Fiches</span>
          <div>
            {compagne.fiches?.length
              ? compagne.fiches.map((f) => f.nomFiche).join(", ")
              : "Non définies"}
          </div>
        </div>

        <div>
          <span className="label">Agent IA</span>
          <div>{compagne.id_ia?.nomAgent || "Non défini"}</div>
        </div>

        <div>
          <span className="label">Timeout</span>
          <div>{compagne.dialTimeout ?? 30}s</div>
        </div>

        <div>
          <span className="label">Appels simultanés</span>
          <div className="concurrentDisplay">
            {Array.from({ length: compagne.maxConcurrentCalls ?? 1 }).map((_, i) => (
              <i key={i} className="bi bi-telephone-fill concurrentDot" />
            ))}
            <span className="concurrentCount">{compagne.maxConcurrentCalls ?? 1}</span>
          </div>
        </div>
      </div>

      <div className="compagneScriptBlock">
        <span className="label">Script final</span>
        <p>{compagne.scriptFinal || compagne.script}</p>
      </div>
    </div>
  );
}