import React, { useEffect, useState } from "react";
import useCompagne from "../../hooks/useCompagne";
import useAgent from "../../hooks/useAgent";
import HeaderBar from "../../components/agents/HeaderBar";
import CompagneCard from "../../components/compagne/CompagneCard";
import CompagneFormModal from "../../components/compagne/CompagneFormModal";
import "../../assets/css/CompagnesPage.css";

export default function CompagnesPage() {
  const { getCompagnes, createCompagne, updateCompagne, deleteCompagne } = useCompagne();
  const { getAgents } = useAgent();

  const [compagnes, setCompagnes] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCompagne, setSelectedCompagne] = useState(null);

  const fetchCompagnes = async () => {
    try {
      setLoading(true);
      const res = await getCompagnes();
      const data = res?.data?.data || [];
      setCompagnes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur récupération campagnes :", error);
      setCompagnes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await getAgents();
      const data = res?.data?.data || [];
      setAgents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur récupération agents :", error);
      setAgents([]);
    }
  };

  useEffect(() => {
    fetchCompagnes();
    fetchAgents();
  }, []);

  const handleCreateClick = () => {
    setSelectedCompagne(null);
    setModalOpen(true);
  };

  const handleEdit = (compagne) => {
    setSelectedCompagne(compagne);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Voulez-vous vraiment supprimer cette campagne ?");
    if (!confirmDelete) return;

    try {
      await deleteCompagne(id);
      fetchCompagnes();
    } catch (error) {
      console.error("Erreur suppression campagne :", error);
    }
  };

  const handleSubmit = async (payload) => {
    try {
      if (selectedCompagne?._id) {
        await updateCompagne(selectedCompagne._id, payload);
      } else {
        await createCompagne(payload);
      }

      setModalOpen(false);
      setSelectedCompagne(null);
      fetchCompagnes();
    } catch (error) {
      console.error("Erreur enregistrement campagne :", error);
    }
  };

  return (
    <div className="compagnesPage">
      <HeaderBar />

      <div className="compagnesContainer">
        <div className="compagnesTopBar">
          <div>
            <h1>Gestion des campagnes</h1>
            <p>
              Gérez les campagnes, les numéros, les scripts et les agents IA associés.
            </p>
          </div>

          <button type="button" className="btnPrimary" onClick={handleCreateClick}>
            <i className="bi bi-plus-lg" /> Nouvelle campagne
          </button>
        </div>

        {loading ? (
          <div className="loadingBox">Chargement des campagnes...</div>
        ) : compagnes.length === 0 ? (
          <div className="emptyBox">Aucune campagne trouvée.</div>
        ) : (
          <div className="compagnesGrid">
            {compagnes.map((compagne) => (
              <CompagneCard
                key={compagne._id}
                compagne={compagne}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <CompagneFormModal
        key={selectedCompagne?._id || "new"}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCompagne(null);
        }}
        onSubmit={handleSubmit}
        selectedCompagne={selectedCompagne}
        agents={agents}
      />
    </div>
  );
}