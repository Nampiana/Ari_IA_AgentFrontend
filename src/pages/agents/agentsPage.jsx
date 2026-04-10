import React, { useEffect, useState } from "react";
import useAgent from "../../hooks/useAgent";
import HeaderBar from "../../components/agents/HeaderBar";
import AgentCard from "../../components/agents/AgentCard";
import AgentFormModal from "../../components/agents/AgentFormModal";
import "../../assets/css/AgentsPage.css";

export default function AgentsPage() {
  const { getAgents, createAgent, updateAgent, deleteAgent } = useAgent();

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

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

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Voulez-vous vraiment supprimer cet agent ?");
    if (!confirmDelete) return;

    try {
      await deleteAgent(id);
      fetchAgents();
    } catch (error) {
      console.error("Erreur suppression :", error);
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
    } catch (error) {
      console.error("Erreur enregistrement agent :", error);
    }
  };

  return (
    <div className="agentsPage">
      <HeaderBar />

      <div className="agentsContainer">
        <div className="agentsTopBar">
          <div>
            <h1>Gestion des agents IA</h1>
            <p>
              Administrez les profils vocaux, les numéros liés et les scripts de vos assistants.
            </p>
          </div>

          <button type="button" className="btnPrimary" onClick={handleCreateClick}>
            <i className="bi bi-plus-lg" /> Nouvel agent
          </button>
        </div>

        {loading ? (
          <div className="loadingBox">Chargement des agents...</div>
        ) : agents.length === 0 ? (
          <div className="emptyBox">Aucun agent trouvé.</div>
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
    </div>
  );
}