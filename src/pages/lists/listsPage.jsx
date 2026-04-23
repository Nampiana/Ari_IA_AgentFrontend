import React, { useEffect, useState } from "react";
import useLists from "../../hooks/useLists";
import HeaderBar from "../../components/agents/HeaderBar";
import Papa from "papaparse";
import "../../assets/css/ListsPage.css";

export default function ListsPage({ showToast }) {
  const {
    getLists,
    createList,
    updateList,
    deleteList,
    getFiches,
    addFiche,
    updateFiche,
    deleteFiche,
  } = useLists();

  const [showAddForm, setShowAddForm] = useState(false);
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
    isAlreadyCalled: 0,
  });
  const [newFiche, setNewFiche] = useState({
    nom: "",
    phone: "",
    email: "",
    ville: "",
    habitation: "",
    age: "",
    codePostale: "",
    entreprise: "",
    pays: "",
    commentaire: "",
  });

  const [visibleColumns, setVisibleColumns] = useState([
    "nom",
    "phone",
    "email",
    "ville",
    "habitation",
    "age",
    "codePostale",
    "entreprise",
    "pays",
    "commentaire",
    "isAlreadyCalled",
  ]);

  const ALL_COLUMNS = [
    "nom",
    "phone",
    "email",
    "ville",
    "habitation",
    "age",
    "codePostale",
    "entreprise",
    "pays",
    "commentaire",
    "isAlreadyCalled",
  ];

  const [search, setSearch] = useState("");
  const [filterFields, setFilterFields] = useState(["nom"]);

  const [fiches, setFiches] = useState([]);
  const [editFiche, setEditFiche] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [loadingFiche, setLoadingFiche] = useState(false);
  const [deleteFicheModal, setDeleteFicheModal] = useState({
    open: false,
    fiche: null,
  });
  const [dirtyFiches, setDirtyFiches] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    list: null,
    loading: false,
  });
  const [showToolsPanel, setShowToolsPanel] = useState(false);

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

  useEffect(() => {
    if (selectedList) {
      fetchFiches(selectedList._id);
    }
  }, [selectedList]);

  const saveAll = async () => {
    try {
      const updates = Object.entries(dirtyFiches);
      for (const [ficheId, data] of updates) {
        await updateFiche(selectedList._id, ficheId, data);
      }
      setDirtyFiches({});
      await fetchFiches(selectedList._id);
      showToast("Modifications enregistrées", "success");
    } catch (err) {
      showToast("Erreur sauvegarde", "danger");
    }
  };

  const fetchFiches = async (id) => {
    try {
      setLoadingFiche(true);
      const res = await getFiches(id);
      setFiches(res.data.data);
    } catch (err) {
      showToast("Erreur chargement fiches", "danger");
    } finally {
      setLoadingFiche(false);
    }
  };

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
        isAlreadyCalled: 0,
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
        isAlreadyCalled: 0,
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
      isAlreadyCalled: 0,
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

  const filteredFiches = fiches.filter((row) => {
    const searchValue = search.toLowerCase();

    if (!searchValue) return true;

    return filterFields.some((field) => {
      const value = row[field]?.toString().toLowerCase() || "";
      return value.includes(searchValue);
    });
  });

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
            <div className="card shadow-sm mb-3">
              <div
                className="card-header d-flex justify-content-between align-items-center"
                style={{ cursor: "pointer" }}
                onClick={() => setShowToolsPanel(!showToolsPanel)}
              >
                <div className="fw-bold">🔍 Filtres & colonnes</div>

                <i
                  className={`bi ${
                    showToolsPanel ? "bi-chevron-up" : "bi-chevron-down"
                  }`}
                />
              </div>

              {showToolsPanel && (
                <div className="card-body py-2">
                  {/* TOP ROW : SEARCH + RESET + TOGGLES */}
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    {/* SEARCH */}
                    <div style={{ flex: 1, minWidth: "220px" }}>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="🔍 Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>

                    {/* RESET */}
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        setSearch("");
                        setFilterFields(["nom"]);
                      }}
                    >
                      Reset
                    </button>
                  </div>

                  {/* SECOND ROW : FILTER + COLUMNS TOGGLE (compact) */}
                  <div className="d-flex flex-wrap gap-3">
                    {/* FILTER COLUMNS (compact pills style) */}
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="text-muted small">Recherche dans :</span>

                      <div className="d-flex flex-wrap gap-1">
                        {ALL_COLUMNS.map((col) => (
                          <label
                            key={col}
                            className={`badge rounded-pill border px-2 py-1 ${
                              filterFields.includes(col)
                                ? "bg-primary text-white"
                                : "bg-light text-dark"
                            }`}
                            style={{ cursor: "pointer", fontSize: "11px" }}
                          >
                            <input
                              type="checkbox"
                              className="d-none"
                              checked={filterFields.includes(col)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilterFields([...filterFields, col]);
                                } else {
                                  setFilterFields(
                                    filterFields.filter((c) => c !== col),
                                  );
                                }
                              }}
                            />
                            {col}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* VISIBILITY (dropdown style compact) */}
                    <div>
                      <div className="fw-semibold mb-2">Colonnes visibles</div>

                      <div className="d-flex flex-wrap gap-3">
                        {ALL_COLUMNS.map((col) => (
                          <div className="form-check" key={col}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={visibleColumns.includes(col)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setVisibleColumns([...visibleColumns, col]);
                                } else {
                                  setVisibleColumns(
                                    visibleColumns.filter((c) => c !== col),
                                  );
                                }
                              }}
                              id={`col-${col}`}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`col-${col}`}
                            >
                              {col}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="content_btn_saving">
              <button
                className="btn btn-success mb-2 ml-2"
                onClick={() => setShowAddForm(true)}
              >
                + Ajouter une fiche
              </button>

              {Object.keys(dirtyFiches).length > 0 && (
                <button
                  className="btn btn-success mb-2"
                  onClick={() => {
                    saveAll();
                  }}
                  style={{ marginLeft: "2px" }}
                >
                  Enregistrer modifications
                </button>
              )}
            </div>
            {showAddForm && (
              <div className="card shadow-sm mt-3 border-0">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Ajouter une fiche</h5>

                  <button
                    className="btn btn-sm btn-light"
                    onClick={() => setShowAddForm(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Nom *</label>
                      <input
                        className="form-control"
                        placeholder="Nom"
                        value={newFiche.nom}
                        onChange={(e) =>
                          setNewFiche({ ...newFiche, nom: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Téléphone *</label>
                      <input
                        className="form-control"
                        placeholder="Téléphone"
                        value={newFiche.phone}
                        onChange={(e) =>
                          setNewFiche({ ...newFiche, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        className="form-control"
                        placeholder="Email"
                        value={newFiche.email}
                        onChange={(e) =>
                          setNewFiche({ ...newFiche, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Ville</label>
                      <input
                        className="form-control"
                        placeholder="Ville"
                        value={newFiche.ville}
                        onChange={(e) =>
                          setNewFiche({ ...newFiche, ville: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Habitation</label>
                      <input
                        className="form-control"
                        placeholder="Habitation"
                        value={newFiche.habitation}
                        onChange={(e) =>
                          setNewFiche({
                            ...newFiche,
                            habitation: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Âge</label>
                      <input
                        className="form-control"
                        placeholder="Âge"
                        value={newFiche.age}
                        onChange={(e) =>
                          setNewFiche({ ...newFiche, age: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Code postal</label>
                      <input
                        className="form-control"
                        placeholder="Code postal"
                        value={newFiche.codePostale}
                        onChange={(e) =>
                          setNewFiche({
                            ...newFiche,
                            codePostale: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Entreprise</label>
                      <input
                        className="form-control"
                        placeholder="Entreprise"
                        value={newFiche.entreprise}
                        onChange={(e) =>
                          setNewFiche({
                            ...newFiche,
                            entreprise: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Pays</label>
                      <input
                        className="form-control"
                        placeholder="Pays"
                        value={newFiche.pays}
                        onChange={(e) =>
                          setNewFiche({ ...newFiche, pays: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Commentaire</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Commentaire"
                        value={newFiche.commentaire}
                        onChange={(e) =>
                          setNewFiche({
                            ...newFiche,
                            commentaire: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setShowAddForm(false)}
                    >
                      Annuler
                    </button>

                    <button
                      className="btn btn-success"
                      onClick={async () => {
                        await addFiche(selectedList._id, newFiche);

                        setNewFiche({
                          nom: "",
                          phone: "",
                          email: "",
                          ville: "",
                          habitation: "",
                          age: "",
                          codePostale: "",
                          entreprise: "",
                          pays: "",
                          commentaire: "",
                        });

                        fetchFiches(selectedList._id);
                        setShowAddForm(false);
                      }}
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loadingFiche ? (
              <p>Chargement...</p>
            ) : (
              <>
                <div class="table-responsive">
                  <table className="table fiche-table-fixed">
                    <thead>
                      <tr>
                        {visibleColumns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredFiches.map((row) => (
                        <tr key={row._id}>
                          {visibleColumns.map((key) => (
                            <td
                              key={key}
                              onClick={() => {
                                if (key === "phone") return;

                                setEditingCell({
                                  id: row._id,
                                  field: key,
                                  value: row[key],
                                });
                              }}
                              style={{
                                cursor: key === "phone" ? "default" : "pointer",
                              }}
                            >
                              {editingCell?.id === row._id &&
                              editingCell?.field === key ? (
                                <>
                                  {key === "isAlreadyCalled" ? (
                                    <select
                                      style={{ width: "100%" }}
                                      defaultValue={
                                        dirtyFiches[row._id]?.[key] ??
                                        editingCell?.value ??
                                        row[key]
                                      }
                                      onChange={(e) => {
                                        const value = e.target.value;

                                        setDirtyFiches((prev) => ({
                                          ...prev,
                                          [row._id]: {
                                            ...prev[row._id],
                                            [key]: value,
                                          },
                                        }));

                                        setEditingCell({
                                          id: row._id,
                                          field: key,
                                          value,
                                        });
                                      }}
                                    >
                                      <option value={0} selected={editingCell.value == 0 ? true : false}>
                                        Non appelé
                                      </option>
                                      <option value={1} selected={editingCell.value == 1 ? true : false}>
                                        Appelé
                                      </option>
                                    </select>
                                  ) : (
                                    <input
                                      style={{ width: "100%" }}
                                      type={
                                        key == "isAlreadyCalled"
                                          ? "number"
                                          : "text"
                                      }
                                      value={
                                        dirtyFiches[row._id]?.[key] ??
                                        editingCell?.value ??
                                        row[key]
                                      }
                                      onChange={(e) => {
                                        const value = e.target.value;

                                        setDirtyFiches((prev) => ({
                                          ...prev,
                                          [row._id]: {
                                            ...prev[row._id],
                                            [key]: value,
                                          },
                                        }));

                                        setEditingCell({
                                          id: row._id,
                                          field: key,
                                          value,
                                        });
                                      }}
                                    />
                                  )}
                                </>
                              ) : (
                                <>
                                {key === "isAlreadyCalled"
                                  ? row[key] == 1
                                    ? "Appelé"
                                    : "Non appelé"
                                  : row[key]}
                                </>
                              )}
                            </td>
                          ))}

                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                setDeleteFicheModal({
                                  open: true,
                                  fiche: row,
                                })
                              }
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="compactStyles_overlay">
          <div className="compactStyles_modal">
            <div className="compactStyles_modalHeader">
              <h2 className="compactStyles_modalTitle">Importer CSV</h2>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="compactStyles_closeButton"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="compactStyles_fieldBlock">
              <label className="compactStyles_label">Nom de la fiche *</label>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Ex: Prospects Paris Avril"
                className="compactStyles_textInput"
              />
            </div>

            <div className="compactStyles_fieldBlock">
              <label className="compactStyles_label">Fichier CSV</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFile}
                className="compactStyles_fileInput"
              />
            </div>

            {columns.length > 0 && (
              <>
                <h4 className="compactStyles_mappingTitle">
                  Mapping des colonnes
                </h4>

                <div className="compactStyles_mappingGrid">
                  {mappingFields.map((field) => (
                    <div key={field.key} className="compactStyles_mappingItem">
                      <label className="compactStyles_label">
                        {field.label}
                      </label>

                      <select
                        value={mapping[field.key]}
                        onChange={(e) =>
                          setMapping({
                            ...mapping,
                            [field.key]: e.target.value,
                          })
                        }
                        className="compactStyles_select"
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

                <div className="compactStyles_actionRow">
                  <button
                    onClick={handleCreate}
                    className="compactStyles_createButton"
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

      {deleteFicheModal.open && (
        <div className="deleteModalOverlay">
          <div className="deleteModal">
            <h3>Confirmation suppression</h3>

            <p>Voulez-vous supprimer cette fiche ?</p>

            <div className="deleteActions">
              <button
                className="btnGhost"
                onClick={() =>
                  setDeleteFicheModal({ open: false, fiche: null })
                }
              >
                Annuler
              </button>

              <button
                className="btnDelete"
                onClick={async () => {
                  await deleteFiche(
                    selectedList._id,
                    deleteFicheModal.fiche._id,
                  );

                  setDeleteFicheModal({ open: false, fiche: null });
                  fetchFiches(selectedList._id);
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
