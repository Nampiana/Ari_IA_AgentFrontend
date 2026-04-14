import React from "react";

export default function AgentCard({ agent, onEdit, onDelete }) {
  return (
    <div className="agentCard">
      <div className="agentCardTop">
        <div>
          <h3 className="agentName">{agent.nomAgent}</h3>
          <div className="agentCompany">{agent.companyName}</div>
        </div>

        <div className="agentStatusWrap">
          <span className={`badge ${agent.active === 1 ? "success" : "danger"}`}>
            {agent.active === 1 ? "Actif" : "Inactif"}
          </span>
          {agent.isDefault === 1 && <span className="badge default">Par défaut</span>}
        </div>
      </div>

      <div className="agentMetaGrid">
        <div>
          <span className="label">Voix</span>
          <div>{agent.voice}</div>
        </div>
        <div>
          <span className="label">Style</span>
          <div>{agent.genderStyle}</div>
        </div>
        <div>
          <span className="label">Vitesse</span>
          <div>{agent.speed}</div>
        </div>
        {/* <div>
          <span className="label">Numéros</span>
          <div>{agent.calledNumbers?.length ? agent.calledNumbers.join(", ") : "Aucun"}</div>
        </div> */}
      </div>

      {/* <div className="agentScriptBlock">
        <span className="label">Script d’ouverture</span>
        <p>{agent.openingScript}</p>
      </div> */}

      <div className="agentActions">
        <button type="button" className="btnEdit" onClick={() => onEdit(agent)}>
          Modifier
        </button>
        <button type="button" className="btnDelete" onClick={() => onDelete(agent._id)}>
          Supprimer
        </button>
      </div>
    </div>
  );
}