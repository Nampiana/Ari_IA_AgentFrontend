import React from "react";

export default function CompagneCard({ compagne, onEdit, onDelete }) {
  return (
    <div className="compagneCard">
      <div className="compagneCardTop">
        <div>
          <h3 className="compagneName">{compagne.nomCompagne}</h3>
          <div className="compagneNumero">{compagne.numero}</div>
        </div>

        <div className="compagneStatusWrap">
          <span className={`badge ${compagne.active === 1 ? "success" : "danger"}`}>
            {compagne.active === 1 ? "Actif" : "Inactif"}
          </span>
        </div>
      </div>

      <div className="compagneMetaGrid">
        <div>
          <span className="label">Numéro</span>
          <div>{compagne.numero || "-"}</div>
        </div>

        <div>
          <span className="label">Agent IA</span>
          <div>{compagne.id_ia?.nomAgent || "Non défini"}</div>
        </div>
      </div>

      <div className="compagneScriptBlock">
        <span className="label">Script final</span>
        <p>{compagne.scriptFinal || compagne.script}</p>
      </div>

      <div className="compagneActions">
        <button type="button" className="btnEdit" onClick={() => onEdit(compagne)}>
          Modifier
        </button>
        <button type="button" className="btnDelete" onClick={() => onDelete(compagne._id)}>
          Supprimer
        </button>
      </div>
    </div>
  );
}