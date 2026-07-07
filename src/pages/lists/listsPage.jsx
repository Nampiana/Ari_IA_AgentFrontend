import React, { useEffect, useState, useMemo } from "react";
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
  const [filterBlackList, setFilterBlackList] = useState("");
  const [filterCalled, setFilterCalled] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [mapping, setMapping] = useState({
    nom: "",
    nomResponsable: "",
    phoneResponsable: "",
    phone: "",
    phone2: "",
    adresse: "",
    habitation: "",
    ville: "",
    age: "",
    codePostale: "",
    email: "",
    entreprise: "",
    pays: "",
    commentaire: "",
    effectif: "",
    isBlackList: 1,
  });
  const [newFiche, setNewFiche] = useState({
    nom: "",
    nomResponsable: "",
    phoneResponsable: "",
    phone: "",
    phone2: "",
    email: "",
    ville: "",
    habitation: "",
    age: "",
    effectif: "",
    codePostale: "",
    entreprise: "",
    pays: "",
    commentaire: "",
  });

  const COLUMN_LABELS = {
    nom: "Nom",
    entreprise: "Entreprise",
    phone: "Téléphone",
    phone2: "Téléphone 2",
    nomResponsable: "Responsable",
    phoneResponsable: "Tél. responsable",
    email: "Email",
    ville: "Ville",
    adresse: "Adresse",
    habitation: "Habitation",
    age: "Âge",
    effectif: "Effectif",
    codePostale: "Code postal",
    pays: "Pays",
    commentaire: "Commentaire",
    isAlreadyCalled: "Appel",
    isBlackList: "Liste noire",
    emailEnvoye: "Email envoyé",
  };

  const IMPORTANT_COLUMNS = [
    "nom",
    "entreprise",
    "phone",
    "phone2",
    "nomResponsable",
    "phoneResponsable",
    "ville",
    "isAlreadyCalled",
    "isBlackList",
  ];

  const ALL_COLUMNS = [
    "nom",
    "entreprise",
    "phone",
    "phone2",
    "nomResponsable",
    "phoneResponsable",
    "email",
    "ville",
    "adresse",
    "habitation",
    "age",
    "effectif",
    "codePostale",
    "pays",
    "commentaire",
    "isAlreadyCalled",
    "isBlackList",
    "emailEnvoye",
  ];

  const [visibleColumns, setVisibleColumns] = useState(IMPORTANT_COLUMNS);

  const [search, setSearch] = useState("");
  const [filterFields, setFilterFields] = useState([
    "nom",
    "phone",
    "email",
    "ville",
    "habitation",
    "age",
    "codePostale",
    "entreprise",
    "pays",
    "effectif",
    "commentaire",
    "isBlackList",
  ]);

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

  const [fichePage, setFichePage] = useState(1);
  const [ficheLimit, setFicheLimit] = useState(10);
  const [ficheTotalPages, setFicheTotalPages] = useState(1);
  const [ficheTotalResults, setFicheTotalResults] = useState(0);

  const [statsFiches, setStatsFiches] = useState({
    total: 0,
    called: 0,
    notCalled: 0,
  });

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => {
      if (prev.includes(col)) {
        return prev.filter((c) => c !== col);
      }

      return [...prev, col];
    });
  };

  const showImportantColumns = () => {
    setVisibleColumns(IMPORTANT_COLUMNS);
  };

  const showAllColumns = () => {
    setVisibleColumns(ALL_COLUMNS);
  };

  const hideOptionalColumns = () => {
    setVisibleColumns(["nom", "phone", "isAlreadyCalled", "isBlackList"]);
  };

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
      setFichePage(1);
      fetchFiches(selectedList._id, 1, ficheLimit);
    }
  }, [selectedList]);

  const saveAll = async () => {
    try {
      const updates = Object.entries(dirtyFiches);
      for (const [ficheId, data] of updates) {
        await updateFiche(selectedList._id, ficheId, data);
      }

      setFiches((prev) =>
        prev.map((fiche) =>
          dirtyFiches[fiche._id]
            ? { ...fiche, ...dirtyFiches[fiche._id] }
            : fiche,
        ),
      );

      setDirtyFiches({});
      setEditingCell(null); // ✅ reset la cellule active
      showToast("Modifications enregistrées", "success");
      await fetchFiches(selectedList._id);
    } catch (err) {
      showToast("Erreur sauvegarde", "danger");
    }
  };

  // ── Remplacez fetchFiches ──────────────────────────────────────────────────
  const fetchFiches = async (id, page = fichePage, limit = ficheLimit) => {
    try {
      setLoadingFiche(true);

      // Construit les params de filtre actifs
      const params = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (filterBlackList !== "") params.isBlackList = filterBlackList;
      if (filterCalled !== "") params.isAlreadyCalled = filterCalled;

      const res = await getFiches(id, params); // ← signature modifiée (voir hook)

      setFiches(res.data.data || []);
      setFicheTotalPages(res.data.totalPages || 1);
      setFicheTotalResults(
        res.data.filteredTotal || res.data.totalResults || 0,
      );
      setFichePage(res.data.currentPage || page);

      // Stats globales — stables peu importe les filtres
      setStatsFiches({
        total: res.data.totalResults || 0,
        called: res.data.totalCalled || 0,
        notCalled: res.data.totalNotCalled || 0,
      });
    } catch (err) {
      console.log(err);

      showToast("Erreur chargement fiches", "danger");
    } finally {
      setLoadingFiche(false);
    }
  };

  // ── Relance la recherche dès que les filtres changent ─────────────────────
  useEffect(() => {
    if (!selectedList) return;
    // Remet à la page 1 quand un filtre change
    setFichePage(1);
    fetchFiches(selectedList._id, 1, ficheLimit);
  }, [search, filterBlackList, filterCalled]);

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

  const callStats = useMemo(() => {
    const called = fiches.filter((f) => f.isAlreadyCalled == 1).length;
    const notCalled = fiches.filter((f) => f.isAlreadyCalled != 1).length;
    return { called, notCalled, total: fiches.length };
  }, [fiches]);

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
    setLoadingCreate(true);
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
        nomResponsable: mapping.nomResponsable
          ? row[mapping.nomResponsable] || ""
          : "",
        phoneResponsable: mapping.phoneResponsable
          ? row[mapping.phoneResponsable] || ""
          : "",
        phone: mapping.phone ? row[mapping.phone] || "" : "",
        phone2: mapping.phone2 ? row[mapping.phone2] || "" : "",
        adresse: mapping.adresse ? row[mapping.adresse] || "" : "",
        habitation: mapping.habitation ? row[mapping.habitation] || "" : "",
        ville: mapping.ville ? row[mapping.ville] || "" : "",
        age: mapping.age ? row[mapping.age] || "" : "",
        effectif: mapping.effectif ? row[mapping.effectif] || "" : "",
        codePostale: mapping.codePostale ? row[mapping.codePostale] || "" : "",
        email: mapping.email ? row[mapping.email] || "" : "",
        entreprise: mapping.entreprise ? row[mapping.entreprise] || "" : "",
        pays: mapping.pays ? row[mapping.pays] || "" : "",
        commentaire: mapping.commentaire ? row[mapping.commentaire] || "" : "",
        isAlreadyCalled: 0,
        isBlackList: 1,
      }));

      await createList({
        nomFiche: listName.trim(),
        infoFiche: formattedData,
      });

      showToast("Liste créée avec succès", "success");
      setLoadingCreate(false);
      setModalOpen(false);
      setListName("");
      setCsvData([]);
      setColumns([]);
      setMapping({
        nom: "",
        nomResponsable: "",
        phoneResponsable: "",
        phone: "",
        phone2: "",
        adresse: "",
        habitation: "",
        ville: "",
        age: "",
        effectif: "",
        codePostale: "",
        email: "",
        entreprise: "",
        pays: "",
        commentaire: "",
        isAlreadyCalled: 0,
        isBlackList: 1,
      });

      fetchLists();
    } catch (err) {
      console.error(err);
      setLoadingCreate(false);
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
      nomResponsable: "",
      phoneResponsable: "",
      phone: "",
      phone2: "",
      adresse: "",
      habitation: "",
      ville: "",
      age: "",
      effectif: "",
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
    { key: "nomResponsable", label: "Nom responsable" },
    { key: "phoneResponsable", label: "Téléphone responsable" },
    { key: "phone", label: "Téléphone *" },
    { key: "phone2", label: "Téléphone 2" },
    { key: "adresse", label: "Adresse" },
    { key: "habitation", label: "Habitation" },
    { key: "ville", label: "Ville" },
    { key: "age", label: "Âge" },
    { key: "effectif", label: "Effectif" },
    { key: "codePostale", label: "Code postal" },
    { key: "email", label: "Email" },
    { key: "entreprise", label: "Entreprise" },
    { key: "pays", label: "Pays" },
    { key: "commentaire", label: "Commentaire" },
  ];

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
                  <td>{list.totalFiches ?? 0}</td>
                  <td>{list.createdAt?.split("T")[0]}</td>
                  <td>{list.updatedAt?.split("T")[0]}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedList(list);
                      }}
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
              <span>
                <h2>Détails de la liste</h2>({selectedList?.nomFiche})
              </span>

              <button
                className="closeBtn"
                onClick={() => setSelectedList(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="callStatsBar">
              <div className="callStatItem callStatItem--total">
                <span className="callStatNumber">{statsFiches.total}</span>
                <span className="callStatLabel">Total</span>
              </div>
              <div className="callStatItem callStatItem--notCalled">
                <span className="callStatNumber">{statsFiches.notCalled}</span>
                <span className="callStatLabel">Non appelés</span>
              </div>
              <div className="callStatItem callStatItem--called">
                <span className="callStatNumber">{statsFiches.called}</span>
                <span className="callStatLabel">Appelés</span>
              </div>
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

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSearch("");
                        setFilterFields(["nom"]);
                        setFilterBlackList("");
                        setFilterCalled("");
                      }}
                    >
                      Reset
                    </button>

                    <select
                      className="form-select form-select-sm"
                      style={{ width: "200px" }}
                      value={filterBlackList}
                      onChange={(e) => setFilterBlackList(e.target.value)}
                    >
                      <option value="">Liste noire : tous</option>
                      <option value="1">Whitelist</option>
                      <option value="2">Blacklist</option>
                    </select>

                    <select
                      className="form-select form-select-sm"
                      style={{ width: "160px" }}
                      value={filterCalled}
                      onChange={(e) => setFilterCalled(e.target.value)}
                    >
                      <option value="">Appel : tous</option>
                      <option value="0">Non appelé</option>
                      <option value="1">Appelé</option>
                    </select>
                  </div>

                  <div className="d-flex flex-wrap gap-3">
                    {/* FILTER COLUMNS (compact pills style) */}
                    {/* <div className="d-flex align-items-center gap-2 flex-wrap">
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
                    </div> */}

                    {/* VISIBILITY (dropdown style compact) */}
                    <div>
                      <div className="columnsPanel">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <div className="fw-semibold">
                              Colonnes à afficher
                            </div>
                            <small className="text-muted">
                              {visibleColumns.length} / {ALL_COLUMNS.length}{" "}
                              colonnes visibles
                            </small>
                          </div>

                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={showImportantColumns}
                            >
                              Importantes
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={showAllColumns}
                            >
                              Tout afficher
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-dark btn-sm"
                              onClick={hideOptionalColumns}
                            >
                              Minimal
                            </button>
                          </div>
                        </div>

                        <div className="columnsCheckboxGrid">
                          {ALL_COLUMNS.map((col) => {
                            const checked = visibleColumns.includes(col);

                            return (
                              <label
                                key={col}
                                className={`columnCheckPill ${checked ? "columnCheckPill--active" : ""}`}
                                htmlFor={`col-${col}`}
                              >
                                <input
                                  id={`col-${col}`}
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleColumn(col)}
                                />

                                <span>{COLUMN_LABELS[col] || col}</span>
                              </label>
                            );
                          })}
                        </div>
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
                      <label className="form-label">Nom responsable</label>
                      <input
                        className="form-control"
                        placeholder="Nom responsable"
                        value={newFiche.nomResponsable}
                        onChange={(e) =>
                          setNewFiche({
                            ...newFiche,
                            nomResponsable: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Téléphone responsable
                      </label>
                      <input
                        className="form-control"
                        placeholder="Téléphone responsable"
                        value={newFiche.phoneResponsable}
                        onChange={(e) =>
                          setNewFiche({
                            ...newFiche,
                            phoneResponsable: e.target.value,
                          })
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
                      <label className="form-label">Téléphone 2</label>
                      <input
                        className="form-control"
                        placeholder="Téléphone 2"
                        value={newFiche.phone2}
                        onChange={(e) =>
                          setNewFiche({ ...newFiche, phone2: e.target.value })
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
                      <label className="form-label">Effectif</label>
                      <input
                        className="form-control"
                        placeholder="Effectif"
                        value={newFiche.effectif}
                        onChange={(e) =>
                          setNewFiche({ ...newFiche, effectif: e.target.value })
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
                          nomResponsable: "",
                          phoneResponsable: "",
                          phone: "",
                          phone2: "",
                          email: "",
                          ville: "",
                          habitation: "",
                          age: "",
                          effectif: "",
                          codePostale: "",
                          entreprise: "",
                          pays: "",
                          commentaire: "",
                        });

                        await fetchFiches(selectedList._id);
                        await fetchLists();

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
                <div className="table-responsive">
                  <table className="table fiche-table-fixed">
                    <thead>
                      <tr>
                        {visibleColumns.map((col) => (
                          <th key={col}>{COLUMN_LABELS[col] || col}</th>
                        ))}
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {fiches.map((row) => (
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
                                  {key === "isAlreadyCalled" ||
                                  key === "isBlackList" ||
                                  key === "emailEnvoye" ? (
                                    <select
                                      style={{
                                        width: "100%",
                                        minWidth: "120px",
                                        padding: "2px 24px 2px 6px",
                                        appearance: "auto",
                                      }}
                                      value={String(
                                        dirtyFiches[row._id]?.[key] ??
                                          row[key] ??
                                          (key === "isBlackList" ? 1 : 0),
                                      )}
                                      onChange={(e) => {
                                        const value = Number(e.target.value);

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
                                      {key === "isAlreadyCalled" ? (
                                        <>
                                          <option value="0">Non appelé</option>
                                          <option value="1">Appelé</option>
                                        </>
                                      ) : key === "isBlackList" ? (
                                        <>
                                          <option value="1">Whitelist</option>
                                          <option value="2">Blacklist</option>
                                        </>
                                      ) : (
                                        <>
                                          <option value="0">Non envoyé</option>
                                          <option value="1">Envoyé</option>
                                        </>
                                      )}
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
                                    ? (dirtyFiches[row._id]?.[key] ??
                                        row[key]) == 1
                                      ? "Appelé"
                                      : "Non appelé"
                                    : key === "isBlackList"
                                      ? (dirtyFiches[row._id]?.[key] ??
                                          row[key] ??
                                          1) == 2
                                        ? "Blacklist"
                                        : "Whitelist"
                                      : key === "emailEnvoye"
                                        ? (dirtyFiches[row._id]?.[key] ??
                                            row[key] ??
                                            0) == 1
                                          ? "Envoyé"
                                          : "Non envoyé"
                                        : (dirtyFiches[row._id]?.[key] ??
                                          row[key])}
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
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>Total : {ficheTotalResults} fiches</div>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={fichePage <= 1}
                        onClick={() =>
                          fetchFiches(
                            selectedList._id,
                            fichePage - 1,
                            ficheLimit,
                          )
                        }
                      >
                        Précédent
                      </button>

                      <span>
                        Page {fichePage} / {ficheTotalPages}
                      </span>

                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={fichePage >= ficheTotalPages}
                        onClick={() =>
                          fetchFiches(
                            selectedList._id,
                            fichePage + 1,
                            ficheLimit,
                          )
                        }
                      >
                        Suivant
                      </button>

                      <select
                        className="form-select form-select-sm"
                        style={{ width: "90px" }}
                        value={ficheLimit}
                        onChange={(e) => {
                          const newLimit = Number(e.target.value);
                          setFicheLimit(newLimit);
                          fetchFiches(selectedList._id, 1, newLimit);
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
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
                        onChange={(e) => {
                          setMapping({
                            ...mapping,
                            [field.key]: e.target.value,
                          });
                        }}
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

                {/*Ajout un loader pendant le traitement*/}
                <div className="compactStyles_actionRow">
                  <button
                    onClick={handleCreate}
                    className="compactStyles_createButton"
                    disabled={loadingCreate}
                  >
                    {loadingCreate ? "Création..." : "Créer la liste"}
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

                  await fetchFiches(selectedList._id);
                  await fetchLists();
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