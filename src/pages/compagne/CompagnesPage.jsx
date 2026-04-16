import React, { useEffect, useState } from "react";
import useCompagne from "../../hooks/useCompagne";
import useAgent from "../../hooks/useAgent";
import HeaderBar from "../../components/agents/HeaderBar";
import CompagneCard from "../../components/compagne/CompagneCard";
import CompagneFormModal from "../../components/compagne/CompagneFormModal";
import "../../assets/css/CompagnesPage.css";
import useLists from "../../hooks/useLists";

export default function CompagnesPage({ showToast }) {
  const { getCompagnes, createCompagne, updateCompagne, deleteCompagne, lancerCompagne } =
    useCompagne();
  const { getAgents } = useAgent();

  const [compagnes, setCompagnes] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCompagne, setSelectedCompagne] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    compagne: null,
    loading: false,
  });
  const { getLists } = useLists();
  const [lists, setLists] = useState([]);

  const fetchLists = async () => {
    try {
      const res = await getLists();
      const data = res?.data?.data || [];
      setLists(data);
    } catch (e) {
      console.error(e);
    }
  };

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
    fetchLists();
  }, []);

  const handleCreateClick = () => {
    setSelectedCompagne(null);
    setModalOpen(true);
  };

  const handleEdit = (compagne) => {
    setSelectedCompagne(compagne);
    setModalOpen(true);
  };

  const handleDelete = (compagne) => {
    setDeleteModal({
      open: true,
      compagne,
      loading: false,
    });
  };

  const lancerCampagne = async (compagne) => {
    try {
      const statusRunning = compagne.isRunning === 1 ? 0 : 1;

      await updateCompagne(compagne._id, { isRunning: statusRunning });
      if (statusRunning === 1) {
        await lancerCompagne(compagne._id);
        showToast("Campagne lancée", "success");
      } else {
        showToast("Campagne arrêtée", "info");
      }

      setCompagnes((prev) =>
        prev.map((c) =>
          c._id === compagne._id ? { ...c, isRunning: statusRunning } : c,
        ),
      );
    } catch (error) {
      console.error("Erreur lancement campagne :", error);
      showToast("Erreur lors du lancement de la campagne", "danger");
    }
  };

  const confirmDelete = async () => {
    const id = deleteModal.compagne;
    const backup = compagnes;
    setCompagnes((prev) => prev.filter((c) => c._id !== id));
    try {
      await deleteCompagne(id);

      showToast("Campagne supprimée avec succès", "success");
      setDeleteModal({ open: false, compagne: null, loading: false });
    } catch (error) {
      setCompagnes(backup);
      showToast("Erreur lors de la suppression", "danger");
    }
  };

  const handleSubmit = async (payload) => {
    try {
      if (selectedCompagne?._id) {
        const updated = await updateCompagne(selectedCompagne._id, payload);
        setCompagnes((prev) =>
          prev.map((c) =>
            c._id === selectedCompagne._id ? { ...c, ...payload } : c,
          ),
        );
        showToast("Campagne mise à jour avec succès", "success");
      } else {
        const created = await createCompagne(payload);
        setCompagnes((prev) => [created, ...prev]);
        showToast("Campagne créée avec succès", "success");
      }
      setModalOpen(false);
      setSelectedCompagne(null);
    } catch (error) {
      console.error("Erreur enregistrement campagne :", error);
      showToast("Erreur lors de l'enregistrement", "danger");
    }
  };

  return (
    <div className="compagnesPage">
      <HeaderBar />

      <div className="agentsContainer">
        <div className="agentsTopBar">
          <div>
            <h1>Gestion des campagnes</h1>
            <p>
              Gérez les campagnes, les numéros, les scripts et les agents IA
              associés.
            </p>
          </div>

          <button
            type="button"
            className="btnPrimary"
            onClick={handleCreateClick}
          >
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
                lancerCampagne={lancerCampagne}
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
        lists={lists}
      />

      {deleteModal.open && (
        <div className="deleteModalOverlay">
          <div className="deleteModal">
            <h3>Supprimer la campagne</h3>

            <p>
              Voulez-vous vraiment supprimer{" "}
              <strong>{deleteModal.compagne?.nom || "cette campagne"}</strong> ?
            </p>

            <div className="deleteActions">
              <button
                className="btnGhost"
                onClick={() =>
                  setDeleteModal({
                    open: false,
                    compagne: null,
                    loading: false,
                  })
                }
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
