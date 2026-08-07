import React, { useEffect, useState, useMemo, useRef } from "react";
import useCompagne from "../../hooks/useCompagne";
import useAgent from "../../hooks/useAgent";
import HeaderBar from "../../components/agents/HeaderBar";
import CompagneCard from "../../components/compagne/CompagneCard";
import CompagneFormModal from "../../components/compagne/CompagneFormModal";
import QualificationModal from "../../components/qualification/QualificationModal";
import EmailConfigModal from "../../components/compagne/Emailconfigmodal";
import "../../assets/css/CompagnesPage.css";
import useLists from "../../hooks/useLists";

export default function CompagnesPage({ showToast }) {
  const {
    getCompagnes,
    createCompagne,
    updateCompagne,
    deleteCompagne,
    lancerAppelCompagne,
  } = useCompagne();
  const { getAgents } = useAgent();

  const [compagnes, setCompagnes] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCompagne, setSelectedCompagne] = useState(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    compagne: null,
    loading: false,
  });
  const { getLists } = useLists();
  const [lists, setLists] = useState([]);

  const [qualificationModal, setQualificationModal] = useState({
    open: false,
    compagne: null,
  });

  const [emailConfigModal, setEmailConfigModal] = useState({
    open: false,
    compagne: null,
  });

  // ── Filtres ──────────────────────────────────────────────────
  const [filterCallType, setFilterCallType] = useState("all"); // "all" | "inbound" | "outbound"
  const [filterRunning, setFilterRunning] = useState("all"); // "all" | "running" | "stopped"
  const [selectedIds, setSelectedIds] = useState([]); // ids des campagnes ciblées
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelectedId = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const resetFilters = () => {
    setFilterCallType("all");
    setFilterRunning("all");
    setSelectedIds([]);
  };

  const hasActiveFilters =
    filterCallType !== "all" || filterRunning !== "all" || selectedIds.length > 0;

  const filteredCompagnes = useMemo(() => {
    return compagnes.filter((c) => {
      if (filterCallType !== "all" && c.callType !== filterCallType) return false;

      if (filterRunning === "running" && c.isRunning !== 1) return false;
      if (filterRunning === "stopped" && c.isRunning === 1) return false;

      if (selectedIds.length > 0 && !selectedIds.includes(c._id)) return false;

      return true;
    });
  }, [compagnes, filterCallType, filterRunning, selectedIds]);

  const handleQualifications = (compagne) => {
    setQualificationModal({
      open: true,
      compagne,
    });
  };

  const handleEmailConfig = (compagne) => {
    setEmailConfigModal({
      open: true,
      compagne,
    });
  };

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
      if (compagne.isRunning == 1) {
        await updateCompagne(compagne._id, {
          isRunning: 0,
        });

        setCompagnes((prev) =>
          prev.map((c) =>
            c._id === compagne._id ? { ...c, isRunning: 0 } : c,
          ),
        );

        showToast("Campagne arrêtée", "info");
        return;
      }

      const resLaunch = await lancerAppelCompagne(compagne._id);

      setCompagnes((prev) =>
        prev.map((c) => (c._id === compagne._id ? { ...c, isRunning: 1 } : c)),
      );

      showToast(resLaunch?.data?.message || "Campagne lancée", "success");
    } catch (error) {
      console.error("Erreur lancement campagne :", error);

      const status = error?.response?.status;
      const message = error?.response?.data?.message || "";

      try {
        await updateCompagne(compagne._id, {
          isRunning: 0,
        });
      } catch (resetError) {
        console.error("Erreur reset isRunning :", resetError);
      }

      setCompagnes((prev) =>
        prev.map((c) => (c._id === compagne._id ? { ...c, isRunning: 0 } : c)),
      );

      if (
        status === 403 ||
        message.includes("plage") ||
        message.includes("Impossible de lancer")
      ) {
        showToast(
          "Les appels sont autorisés uniquement pendant la plage horaire configurée.",
          "warning",
        );
        return;
      }

      showToast(message || "Erreur lors du lancement de la campagne", "danger");
    }
  };

  const confirmDelete = async () => {
    const id = deleteModal.compagne?._id;
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
      setLoadingUpdate(true);
      if (selectedCompagne?._id) {
        const updated = await updateCompagne(selectedCompagne._id, payload);
        const updatedData = updated?.data?.data;
        setCompagnes((prev) =>
          prev.map((c) => (c._id === selectedCompagne._id ? updatedData : c)),
        );

        showToast("Campagne mise à jour avec succès", "success");
      } else {
        const res = await createCompagne(payload);
        const newData = res?.data?.data;
        setCompagnes((prev) => [newData, ...prev]);
        showToast("Campagne créée avec succès", "success");
      }
      setModalOpen(false);
      setSelectedCompagne(null);
      setLoadingUpdate(false);
    } catch (error) {
      console.error("Erreur enregistrement campagne :", error);
      showToast("Erreur lors de l'enregistrement", "danger");
      setLoadingUpdate(false);
    }
  };

  const handleToggleBackgroundNoise = async (compagne) => {
    const nextValue = !compagne.backgroundNoise;

    const backup = compagnes;

    try {
      setCompagnes((prev) =>
        prev.map((c) =>
          c._id === compagne._id ? { ...c, backgroundNoise: nextValue } : c,
        ),
      );

      const res = await updateCompagne(compagne._id, {
        backgroundNoise: nextValue,
      });

      const updated = res?.data?.data;

      if (updated) {
        setCompagnes((prev) =>
          prev.map((c) => (c._id === compagne._id ? updated : c)),
        );
      }

      showToast(
        nextValue
          ? "Bruit de fond activé pour cette campagne"
          : "Bruit de fond désactivé pour cette campagne",
        "success",
      );
    } catch (error) {
      console.error("Erreur toggle bruit de fond :", error);
      setCompagnes(backup);
      showToast("Erreur lors de la modification du bruit de fond", "danger");
    }
  };

  const totalCount = compagnes.length;
  const activeCount = compagnes.filter((c) => c.active === 1).length;
  const runningCount = compagnes.filter((c) => c.isRunning === 1).length;

  return (
    <div className="campPage">
      <HeaderBar />

      <div className="campContainer">
        <section className="campHero">
          <div className="campHero__text">
            <span className="campHero__eyebrow">
              <span className="campHero__dot" />
              Centre d'appel piloté par IA
            </span>
            <h1>Campagnes</h1>
            <p>
              Configurez les numéros, scripts et agents IA de vos campagnes
              d'appels automatiques et manuels.
            </p>
          </div>

          <div className="campHero__stats">
            <div className="campStat">
              <span className="campStat__value">{totalCount}</span>
              <span className="campStat__label">Campagnes</span>
            </div>
            <div className="campStat campStat--live">
              <span className="campStat__value">{activeCount}</span>
              <span className="campStat__label">Actives</span>
            </div>
            <div className="campStat campStat--signal">
              <span className="campStat__value">{runningCount}</span>
              <span className="campStat__label">En appel</span>
            </div>
          </div>

          <button
            type="button"
            className="campBtnPrimary"
            onClick={handleCreateClick}
          >
            <i className="bi bi-plus-lg" />
            Nouvelle campagne
          </button>
        </section>

        {/* ── SECTION FILTRES ─────────────────────────────────── */}
        <section className="campFilters">
          <div className="campFilterGroup">
            <span className="campFilterGroup__label">Type d'appel</span>
            <div className="campSegmented">
              <button
                type="button"
                className={`campSegmented__btn ${
                  filterCallType === "all" ? "is-active" : ""
                }`}
                onClick={() => setFilterCallType("all")}
              >
                Tous
              </button>
              <button
                type="button"
                className={`campSegmented__btn ${
                  filterCallType === "inbound" ? "is-active" : ""
                }`}
                onClick={() => setFilterCallType("inbound")}
              >
                <i className="bi bi-telephone-inbound-fill" />
                Entrant
              </button>
              <button
                type="button"
                className={`campSegmented__btn ${
                  filterCallType === "outbound" ? "is-active" : ""
                }`}
                onClick={() => setFilterCallType("outbound")}
              >
                <i className="bi bi-telephone-outbound-fill" />
                Sortant
              </button>
            </div>
          </div>

          <div className="campFilterGroup">
            <span className="campFilterGroup__label">Statut</span>
            <div className="campSegmented">
              <button
                type="button"
                className={`campSegmented__btn ${
                  filterRunning === "all" ? "is-active" : ""
                }`}
                onClick={() => setFilterRunning("all")}
              >
                Toutes
              </button>
              <button
                type="button"
                className={`campSegmented__btn campSegmented__btn--live ${
                  filterRunning === "running" ? "is-active" : ""
                }`}
                onClick={() => setFilterRunning("running")}
              >
                <span className="campSegmented__dot" />
                Lancer
              </button>
              <button
                type="button"
                className={`campSegmented__btn ${
                  filterRunning === "stopped" ? "is-active" : ""
                }`}
                onClick={() => setFilterRunning("stopped")}
              >
                Arrêter
              </button>
            </div>
          </div>

          <div className="campFilterGroup campFilterGroup--picker" ref={pickerRef}>
            <span className="campFilterGroup__label">Campagnes</span>
            <button
              type="button"
              className={`campFilterSelectBtn ${
                selectedIds.length > 0 ? "is-active" : ""
              }`}
              onClick={() => setPickerOpen((o) => !o)}
            >
              <i className="bi bi-funnel-fill" />
              {selectedIds.length > 0
                ? `${selectedIds.length} sélectionnée${
                    selectedIds.length > 1 ? "s" : ""
                  }`
                : "Sélectionner..."}
              <i
                className={`bi bi-chevron-down campFilterSelectBtn__chevron ${
                  pickerOpen ? "is-open" : ""
                }`}
              />
            </button>

            {pickerOpen && (
              <div className="campFilterDropdown">
                {compagnes.length === 0 ? (
                  <div className="campFilterDropdown__empty">
                    Aucune campagne
                  </div>
                ) : (
                  compagnes.map((c) => (
                    <label key={c._id} className="campFilterCheckItem">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c._id)}
                        onChange={() => toggleSelectedId(c._id)}
                      />
                      <span className="campFilterCheckItem__name">
                        {c.nomCompagne}
                      </span>
                      <span
                        className={`campFilterCheckItem__dot ${
                          c.isRunning === 1 ? "is-live" : ""
                        }`}
                      />
                    </label>
                  ))
                )}
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    className="campFilterDropdown__clear"
                    onClick={() => setSelectedIds([])}
                  >
                    Effacer la sélection
                  </button>
                )}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="campFilterReset"
              onClick={resetFilters}
            >
              <i className="bi bi-x-circle-fill" />
              Réinitialiser
            </button>
          )}

        </section>
        {/* ── FIN SECTION FILTRES ─────────────────────────────── */}

        {loading ? (
          <div className="campState">
            <i className="bi bi-hourglass-split" />
            Chargement des campagnes...
          </div>
        ) : filteredCompagnes.length === 0 ? (
          <div className="campState campState--empty">
            <i className="bi bi-inboxes" />
            <p>
              {compagnes.length === 0
                ? "Aucune campagne pour le moment."
                : "Aucune campagne ne correspond aux filtres."}
            </p>
            {compagnes.length === 0 ? (
              <button
                type="button"
                className="campBtnPrimary"
                onClick={handleCreateClick}
              >
                <i className="bi bi-plus-lg" />
                Créer une campagne
              </button>
            ) : (
              <button
                type="button"
                className="campBtnPrimary"
                onClick={resetFilters}
              >
                <i className="bi bi-x-circle" />
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="campGridWrap">
            {filteredCompagnes.map((compagne) => (
              <CompagneCard
                key={compagne._id}
                compagne={compagne}
                onEdit={handleEdit}
                onDelete={handleDelete}
                lancerCampagne={lancerCampagne}
                onQualifications={handleQualifications}
                onToggleBackgroundNoise={handleToggleBackgroundNoise}
                onEmailConfig={handleEmailConfig}
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
        loadingUpdate={loadingUpdate}
      />

      <QualificationModal
        open={qualificationModal.open}
        compagne={qualificationModal.compagne}
        showToast={showToast}
        onClose={() =>
          setQualificationModal({
            open: false,
            compagne: null,
          })
        }
        onCompagneUpdated={(updated) => {
          if (!updated) return;

          setCompagnes((prev) =>
            prev.map((c) => (c._id === updated._id ? updated : c)),
          );

          setQualificationModal((prev) => ({
            ...prev,
            compagne: updated,
          }));
        }}
      />

      <EmailConfigModal
        open={emailConfigModal.open}
        compagne={emailConfigModal.compagne}
        showToast={showToast}
        onClose={() =>
          setEmailConfigModal({
            open: false,
            compagne: null,
          })
        }
      />

      {deleteModal.open && (
        <div className="deleteModalOverlay">
          <div className="deleteModal">
            <h3>Supprimer la campagne</h3>

            <p>
              Voulez-vous vraiment supprimer{" "}
              <strong>
                {deleteModal.compagne?.nomCompagne || "cette campagne"}
              </strong>
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