import React, { useEffect, useState } from "react";
import useAgent from "../../hooks/useAgent";
import HeaderBar from "../../components/agents/HeaderBar";
import AgentCard from "../../components/agents/AgentCard";
import AgentFormModal from "../../components/agents/AgentFormModal";
import "../../assets/css/AgentsPage.css";

export default function AgentsPage({ showToast }) {
  const { getAgents, createAgent, updateAgent, deleteAgent } = useAgent();

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    agent: null,
    loading: false,
  });

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await getAgents();
      const data = res?.data?.data || [];
      setAgents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur récupération agents :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateClick = () => {
    setSelectedAgent(null);
    setModalOpen(true);
  };

  const handleEdit = (agent) => {
    setSelectedAgent(agent);
    setModalOpen(true);
  };

  const handleDelete = (agent) => {
    setDeleteModal({
      open: true,
      agent,
      loading: false,
    });
  };

  const confirmDelete = async () => {
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await deleteAgent(deleteModal.agent);
      showToast("Agent supprimé avec succès", "success");
      setDeleteModal({ open: false, agent: null, loading: false });
      fetchAgents();
    } catch (error) {
      console.error("Erreur suppression :", error);
      showToast("Erreur lors de la suppression", "danger");
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSubmit = async (payload) => {
    try {
      if (selectedAgent?._id) {
        await updateAgent(selectedAgent._id, payload);
      } else {
        await createAgent(payload);
      }
      setModalOpen(false);
      setSelectedAgent(null);
      fetchAgents();
      showToast(
        selectedAgent?._id
          ? "Agent mis à jour avec succès"
          : "Agent créé avec succès",
        "success",
      );
    } catch (error) {
      console.error("Erreur enregistrement agent :", error);
      showToast("Erreur lors de l'enregistrement de l'agent", "danger");
    }
  };

  const totalCount = agents.length;
  const activeCount = agents.filter((a) => a.active === 1).length;

  return (
    <div className="agentsPage">
      <HeaderBar />

      <div className="agentsContainer">
        <section className="agentsHero">
          <div className="agentsHero__text">
            <span className="agentsHero__eyebrow">
              <span className="agentsHero__dot" />
              Personas vocaux IA
            </span>
            <h1>Agents IA</h1>
            <p>
              Administrez les profils vocaux, les numéros liés et les scripts de
              vos assistants d'appel.
            </p>
          </div>

          <div className="agentsHero__stats">
            <div className="agentStat">
              <span className="agentStat__value">{totalCount}</span>
              <span className="agentStat__label">Agents</span>
            </div>
            <div className="agentStat agentStat--live">
              <span className="agentStat__value">{activeCount}</span>
              <span className="agentStat__label">Actifs</span>
            </div>
          </div>

          <button
            type="button"
            className="agentBtnPrimary"
            onClick={handleCreateClick}
          >
            <i className="bi bi-plus-lg" />
            Nouvel agent
          </button>
        </section>

        {loading ? (
          <div className="agentState">
            <i className="bi bi-hourglass-split" />
            Chargement des agents...
          </div>
        ) : agents.length === 0 ? (
          <div className="agentState agentState--empty">
            <i className="bi bi-person-badge" />
            <p>Aucun agent trouvé.</p>
            <button
              type="button"
              className="agentBtnPrimary"
              onClick={handleCreateClick}
            >
              <i className="bi bi-plus-lg" />
              Créer un agent
            </button>
          </div>
        ) : (
          <div className="agentsGrid">
            {agents.map((agent) => (
              <AgentCard
                key={agent._id}
                agent={agent}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AgentFormModal
        key={selectedAgent?._id || "new"}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedAgent(null);
        }}
        onSubmit={handleSubmit}
        selectedAgent={selectedAgent}
      />

      {deleteModal.open && (
        <div className="deleteModalOverlay">
          <div className="deleteModal">
            <h3>Supprimer l'agent</h3>
            <p>
              Voulez-vous vraiment supprimer{" "}
              <strong>{deleteModal.agent?.nomAgent}</strong> ?
            </p>

            <div className="deleteActions">
              <button
                className="btnGhost"
                onClick={() => setDeleteModal({ open: false, agent: null })}
                disabled={deleteModal.loading}
              >
                Annuler
              </button>

              <button
                className="btnDelete"
                onClick={confirmDelete}
                disabled={deleteModal.loading}
              >
                {deleteModal.loading ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
