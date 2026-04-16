import React, { useEffect, useState } from "react";
import useLists from "../../hooks/useLists";
import HeaderBar from "../../components/agents/HeaderBar";
import Papa from "papaparse";
import "../../assets/css/ListsPage.css";

export default function ListsPage({ showToast }) {
  const { getLists, createList, updateList, deleteList } = useLists();

  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editList, setEditList] = useState(null);
  const [newName, setNewName] = useState("");
  const [listName, setListName] = useState("");
  const [csvData, setCsvData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [mapping, setMapping] = useState({
    nom: "",
    phone: "",
    adresse: "",
    habitation: "",
    ville: "",
    age: "",
    codePostale: "",
    email: "",
    entreprise: "",
    pays: "",
    commentaire: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    list: null,
    loading: false,
  });

  const fetchLists = async () => {
    try {
      setLoading(true);
      const res = await getLists();
      setLists(res?.data?.data || []);
    } catch (err) {
      showToast("Erreur chargement listes", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data || []);
        setColumns(Object.keys(results.data?.[0] || {}));
      },
      error: () => {
        showToast("Erreur lecture du fichier CSV", "danger");
      },
    });
  };

  const handleUpdateName = async () => {
    if (!editList || !newName.trim()) {
      return showToast("Nom invalide", "warning");
    }

    try {
      await updateList(editList._id, {
        nomFiche: newName.trim(),
      });

      showToast("Nom modifié avec succès", "success");
      setEditList(null);
      setNewName("");
      fetchLists();
    } catch (err) {
      console.error(err);
      showToast("Erreur modification", "danger");
    }
  };

  const handleCreate = async () => {
    if (!listName.trim()) {
      return showToast("Le nom de la fiche est obligatoire", "warning");
    }

    if (!mapping.nom || !mapping.phone) {
      return showToast("Le nom et le téléphone sont obligatoires", "warning");
    }

    if (!csvData.length) {
      return showToast("Veuillez importer un fichier CSV", "warning");
    }

    try {
      const formattedData = csvData.map((row) => ({
        nom: mapping.nom ? row[mapping.nom] || "" : "",
        phone: mapping.phone ? row[mapping.phone] || "" : "",
        adresse: mapping.adresse ? row[mapping.adresse] || "" : "",
        habitation: mapping.habitation ? row[mapping.habitation] || "" : "",
        ville: mapping.ville ? row[mapping.ville] || "" : "",
        age: mapping.age ? row[mapping.age] || "" : "",
        codePostale: mapping.codePostale ? row[mapping.codePostale] || "" : "",
        email: mapping.email ? row[mapping.email] || "" : "",
        entreprise: mapping.entreprise ? row[mapping.entreprise] || "" : "",
        pays: mapping.pays ? row[mapping.pays] || "" : "",
        commentaire: mapping.commentaire ? row[mapping.commentaire] || "" : "",
      }));

      await createList({
        nomFiche: listName.trim(),
        infoFiche: formattedData,
      });

      showToast("Liste créée avec succès", "success");

      setModalOpen(false);
      setListName("");
      setCsvData([]);
      setColumns([]);
      setMapping({
        nom: "",
        phone: "",
        adresse: "",
        habitation: "",
        ville: "",
        age: "",
        codePostale: "",
        email: "",
        entreprise: "",
        pays: "",
        commentaire: "",
      });

      fetchLists();
    } catch (err) {
      console.error(err);
      showToast("Erreur création", "danger");
    }
  };

  const handleDeleteClick = (list) => {
    setDeleteModal({
      open: true,
      list,
      loading: false,
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.list?._id) return;

    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));

      await deleteList(deleteModal.list._id);

      showToast("Liste supprimée", "success");

      setDeleteModal({
        open: false,
        list: null,
        loading: false,
      });

      if (selectedList?._id === deleteModal.list._id) {
        setSelectedList(null);
      }

      fetchLists();
    } catch (err) {
      console.error(err);
      showToast("Erreur suppression", "danger");
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const openImportModal = () => {
    setModalOpen(true);
    setListName("");
    setCsvData([]);
    setColumns([]);
    setMapping({
      nom: "",
      phone: "",
      adresse: "",
      habitation: "",
      ville: "",
      age: "",
      codePostale: "",
      email: "",
      entreprise: "",
      pays: "",
      commentaire: "",
    });
  };

  const mappingFields = [
    { key: "nom", label: "Nom *" },
    { key: "phone", label: "Téléphone *" },
    { key: "adresse", label: "Adresse" },
    { key: "habitation", label: "Habitation" },
    { key: "ville", label: "Ville" },
    { key: "age", label: "Âge" },
    { key: "codePostale", label: "Code postal" },
    { key: "email", label: "Email" },
    { key: "entreprise", label: "Entreprise" },
    { key: "pays", label: "Pays" },
    { key: "commentaire", label: "Commentaire" },
  ];

  const compactStyles = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.45)",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: "20px",
    },
    modal: {
      width: "100%",
      maxWidth: "860px",
      background: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 18px 45px rgba(15, 23, 42, 0.16)",
      padding: "18px 20px 18px 20px",
      position: "relative",
      maxHeight: "88vh",
      overflowY: "auto",
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px",
    },
    modalTitle: {
      margin: 0,
      fontSize: "24px",
      fontWeight: 700,
      color: "#1f2937",
    },
    closeButton: {
      width: "38px",
      height: "38px",
      borderRadius: "50%",
      border: "none",
      background: "#f3f4f6",
      color: "#6b7280",
      fontSize: "16px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    fieldBlock: {
      marginBottom: "14px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    label: {
      fontSize: "13px",
      fontWeight: 600,
      color: "#374151",
    },
    textInput: {
      height: "40px",
      borderRadius: "10px",
      border: "1px solid #d1d5db",
      padding: "0 12px",
      fontSize: "13px",
      background: "#fff",
      color: "#111827",
      outline: "none",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      width: "100%",
    },
    fileInput: {
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "10px",
      background: "#f9fafb",
      color: "#374151",
      fontSize: "13px",
      width: "100%",
    },
    mappingTitle: {
      textAlign: "center",
      fontSize: "18px",
      fontWeight: 700,
      color: "#1f2937",
      marginBottom: "14px",
      marginTop: "4px",
    },
    mappingGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "12px",
      alignItems: "start",
    },
    mappingItem: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    select: {
      height: "40px",
      borderRadius: "10px",
      border: "1px solid #d1d5db",
      padding: "0 10px",
      fontSize: "13px",
      background: "#fff",
      color: "#111827",
      outline: "none",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    },
    actionRow: {
      marginTop: "18px",
      display: "flex",
      justifyContent: "flex-end",
    },
    createButton: {
      minWidth: "140px",
      height: "42px",
      border: "none",
      borderRadius: "10px",
      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      color: "#fff",
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: "0 8px 18px rgba(37, 99, 235, 0.22)",
    },
  };

  return (
    <div className="listsPage">
      <HeaderBar />

      <div className="agentsContainer">
        <div className="agentsTopBar">
          <div>
            <h1>Gestion des listes</h1>
            <p>Liste des fiches clients</p>
          </div>

          <button className="btnPrimary" onClick={openImportModal}>
            Import CSV
          </button>
        </div>

        {loading ? (
          <div className="loadingBox">Chargement...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Total fiches</th>
                <th>Date instertion</th>
                <th>Dernière modification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lists.map((list) => (
                <tr key={list._id}>
                  <td>{list.nomFiche}</td>
                  <td>{list.infoFiche?.length}</td>
                  <td>{list.createdAt?.split("T")[0]}</td>
                  <td>{list.updatedAt?.split("T")[0]}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => setSelectedList(list)}
                    >
                      Voir
                    </button>

                    <button
                      className="btn btn-danger"
                      style={{ marginLeft: "2px" }}
                      onClick={() => handleDeleteClick(list)}
                    >
                      Supprimer
                    </button>

                    <button
                      className="btn btn-warning"
                      style={{ marginLeft: "5px" }}
                      onClick={() => {
                        setEditList(list);
                        setNewName(list.nomFiche);
                      }}
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selectedList && (
          <div className="listDetails">
            <div className="listDetailsHeader">
              <h2>Détails de la liste</h2>

              <button
                className="closeBtn"
                onClick={() => setSelectedList(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <table className="table">
              <thead>
                <tr>
                  {Object.keys(selectedList.infoFiche[0] || {}).map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedList.infoFiche.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, idx) => (
                      <td key={idx}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div style={compactStyles.overlay}>
          <div style={compactStyles.modal}>
            <div style={compactStyles.modalHeader}>
              <h2 style={compactStyles.modalTitle}>Importer CSV</h2>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={compactStyles.closeButton}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div style={compactStyles.fieldBlock}>
              <label style={compactStyles.label}>Nom de la fiche *</label>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Ex: Prospects Paris Avril"
                style={compactStyles.textInput}
              />
            </div>

            <div style={compactStyles.fieldBlock}>
              <label style={compactStyles.label}>Fichier CSV</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFile}
                style={compactStyles.fileInput}
              />
            </div>

            {columns.length > 0 && (
              <>
                <h4 style={compactStyles.mappingTitle}>Mapping des colonnes</h4>

                <div style={compactStyles.mappingGrid}>
                  {mappingFields.map((field) => (
                    <div key={field.key} style={compactStyles.mappingItem}>
                      <label style={compactStyles.label}>{field.label}</label>
                      <select
                        value={mapping[field.key]}
                        onChange={(e) =>
                          setMapping({
                            ...mapping,
                            [field.key]: e.target.value,
                          })
                        }
                        style={compactStyles.select}
                      >
                        <option value="">Choisir une colonne</option>
                        {columns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div style={compactStyles.actionRow}>
                  <button
                    onClick={handleCreate}
                    style={compactStyles.createButton}
                  >
                    Créer la liste
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {editList && (
        <div className="modalOverlay">
          <div className="insertFicheModal">
            <div className="modalInsertFicheHeader">
              <h2>Modifier le nom</h2>

              <button className="closeBtn" onClick={() => setEditList(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <input
              className="form-control"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom de la fiche"
            />

            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setEditList(null)}
              >
                Annuler
              </button>

              <button className="btn btn-primary" onClick={handleUpdateName}>
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.open && (
        <div className="deleteModalOverlay">
          <div className="deleteModal">
            <h3>Supprimer la liste</h3>

            <p>
              Voulez-vous vraiment supprimer{" "}
              <strong>{deleteModal.list?.nomFiche || "cette liste"}</strong> ?
            </p>

            <div className="deleteActions">
              <button
                className="btnGhost"
                onClick={() =>
                  setDeleteModal({
                    open: false,
                    list: null,
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