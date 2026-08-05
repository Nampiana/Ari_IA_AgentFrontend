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

  const [refreshing, setRefreshing] = useState(false);
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

  const totalFichesGlobal = useMemo(
    () => lists.reduce((sum, l) => sum + (l.totalFiches || 0), 0),
    [lists],
  );

  // ── Fiches restant à appeler (whitelist + non appelées) ────────────────────
  // Tolère plusieurs noms de champs selon ce que renvoie l'API (getLists) :
  // le back peut exposer directement le compte (totalToCall / remainingToCall /
  // totalNotCalled), ou seulement totalCalled (+ totalBlackList en option),
  // auquel cas on le déduit. Si rien n'est disponible, on affiche "—".
  const getRemainingToCall = (list) => {
    if (list.totalToCall != null) return list.totalToCall;
    if (list.remainingToCall != null) return list.remainingToCall;
    if (list.totalNotCalled != null) return list.totalNotCalled;

    if (list.totalFiches != null && list.totalCalled != null) {
      const blacklisted = list.totalBlackList ?? 0;
      return Math.max(list.totalFiches - list.totalCalled - blacklisted, 0);
    }

    return null;
  };

  const totalRemainingGlobal = useMemo(() => {
    const values = lists.map(getRemainingToCall).filter((v) => v != null);
    if (!values.length) return null;
    return values.reduce((sum, v) => sum + v, 0);
  }, [lists]);

  const getInitials = (name) =>
    String(name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "L";

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

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchLists();
      if (selectedList) {
        await fetchFiches(selectedList._id, fichePage, ficheLimit);
      }
      showToast("Liste actualisée", "success");
    } catch (err) {
      showToast("Erreur lors de l'actualisation", "danger");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="listsPage">
      <HeaderBar />

      <div className="listsContainer">
        {/* ---------------------------------------------------------- HERO */}
        <section className="listsHero">
          <div className="listsHero__text">
            <span className="listsHero__eyebrow">
              <span className="listsHero__dot" />
              Répertoires d'appel
            </span>
            <h1>Listes &amp; fiches</h1>
            <p>
              Importez vos contacts, organisez vos répertoires et suivez
              l'avancement des appels de vos campagnes.
            </p>
          </div>

          <div className="listsHero__stats">
            <div className="listStat">
              <span className="listStat__value">{lists.length}</span>
              <span className="listStat__label">Listes</span>
            </div>
            <div className="listStat">
              <span className="listStat__value">{totalFichesGlobal}</span>
              <span className="listStat__label">Fiches</span>
            </div>
            <div className="listStat listStat--callable">
              <span className="listStat__value">
                {totalRemainingGlobal ?? "—"}
              </span>
              <span className="listStat__label">À appeler</span>
            </div>
          </div>

          <button
            type="button"
            className="listBtnGhost listBtnRefresh"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Rafraîchir les listes"
          >
            <i
              className={`bi bi-arrow-clockwise ${refreshing ? "listSpin" : ""}`}
            />
            {refreshing ? "Actualisation..." : "Rafraîchir"}
          </button>

          <button
            type="button"
            className="listBtnPrimary"
            onClick={openImportModal}
          >
            <i className="bi bi-upload" />
            Import CSV
          </button>
        </section>

        {/* ---------------------------------------------------------- TABLE LISTES */}
        {loading ? (
          <div className="listState">
            <i className="bi bi-hourglass-split" />
            Chargement des listes...
          </div>
        ) : lists.length === 0 ? (
          <div className="listState">
            <i className="bi bi-inboxes" />
            <p style={{ margin: 0, fontWeight: 600, color: "var(--list-ink)" }}>
              Aucune liste trouvée.
            </p>
            <button
              type="button"
              className="listBtnPrimary"
              onClick={openImportModal}
            >
              <i className="bi bi-upload" />
              Importer une liste
            </button>
          </div>
        ) : (
          <div className="listTableCard">
            <table className="listTable">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Total fiches</th>
                  <th>Reste à appeler</th>
                  <th>Date insertion</th>
                  <th>Dernière modification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lists.map((list) => (
                  <tr key={list._id}>
                    <td>
                      <div className="listNameCell">
                        <span className="listNameCell__avatar">
                          {getInitials(list.nomFiche)}
                        </span>
                        {list.nomFiche}
                      </div>
                    </td>
                    <td>
                      <span className="listCountPill">
                        <i className="bi bi-person-lines-fill" />
                        {list.totalFiches ?? 0}
                      </span>
                    </td>
                    <td>
                      {getRemainingToCall(list) != null ? (
                        <span className="listCountPill listCountPill--callable">
                          <i className="bi bi-telephone-outbound" />
                          {getRemainingToCall(list)}
                        </span>
                      ) : (
                        <span
                          className="listCountPill listCountPill--muted"
                          title="Donnée non fournie par l'API pour cette liste"
                        >
                          <i className="bi bi-dash-circle" />—
                        </span>
                      )}
                    </td>
                    <td className="listDateCell">
                      {list.createdAt?.split("T")[0]}
                    </td>
                    <td className="listDateCell">
                      {list.updatedAt?.split("T")[0]}
                    </td>
                    <td>
                      <div className="listRowActions">
                        <button
                          className="listActionBtn listActionBtn--view"
                          onClick={() => setSelectedList(list)}
                        >
                          <i className="bi bi-eye" /> Voir
                        </button>

                        <button
                          className="listActionBtn listActionBtn--edit"
                          onClick={() => {
                            setEditList(list);
                            setNewName(list.nomFiche);
                          }}
                        >
                          <i className="bi bi-pencil" /> Modifier
                        </button>

                        <button
                          className="listActionBtn listActionBtn--delete"
                          onClick={() => handleDeleteClick(list)}
                        >
                          <i className="bi bi-trash" /> Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ---------------------------------------------------------- DÉTAILS */}
        {/* Modale plein écran, volontairement non fermable au clic extérieur :
            la liste des fiches est une zone de travail (édition, filtres...),
            un clic accidentel en dehors ne doit pas faire perdre le contexte. */}
        {selectedList && (
          <div className="listDetailsOverlay">
            <div className="listDetails">
              <div className="listDetailsHeader">
                <span>
                  <h2>Détails de la liste</h2>
                  <span>({selectedList?.nomFiche})</span>
                </span>

                <button
                  className="listIconBtn"
                  onClick={() =>
                    fetchFiches(selectedList._id, fichePage, ficheLimit)
                  }
                  title="Rafraîchir les fiches"
                  aria-label="Rafraîchir"
                >
                  <i className="bi bi-arrow-clockwise" />
                </button>

                <button
                  className="listModal__close"
                  onClick={() => setSelectedList(null)}
                  aria-label="Fermer"
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
                  <span className="callStatNumber">
                    {statsFiches.notCalled}
                  </span>
                  <span className="callStatLabel">Non appelés</span>
                </div>
                <div className="callStatItem callStatItem--called">
                  <span className="callStatNumber">{statsFiches.called}</span>
                  <span className="callStatLabel">Appelés</span>
                </div>
              </div>

              <div className="listToolsCard">
                <div
                  className="listToolsCard__header"
                  onClick={() => setShowToolsPanel(!showToolsPanel)}
                >
                  <span className="listToolsCard__title">
                    <i className="bi bi-sliders" />
                    Filtres &amp; colonnes
                  </span>

                  <i
                    className={`bi ${
                      showToolsPanel ? "bi-chevron-up" : "bi-chevron-down"
                    }`}
                  />
                </div>

                {showToolsPanel && (
                  <div className="listToolsCard__body">
                    {/* TOP ROW : SEARCH + RESET + TOGGLES */}
                    <div className="listFilterRow">
                      <input
                        type="text"
                        className="listSearchInput"
                        placeholder="🔍 Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />

                      <button
                        className="listBtnGhost"
                        onClick={() => {
                          setSearch("");
                          setFilterFields(["nom"]);
                          setFilterBlackList("");
                          setFilterCalled("");
                        }}
                      >
                        Réinitialiser
                      </button>

                      <select
                        className="listSelect"
                        value={filterBlackList}
                        onChange={(e) => setFilterBlackList(e.target.value)}
                      >
                        <option value="">Liste noire : tous</option>
                        <option value="1">Whitelist</option>
                        <option value="2">Blacklist</option>
                      </select>

                      <select
                        className="listSelect"
                        value={filterCalled}
                        onChange={(e) => setFilterCalled(e.target.value)}
                      >
                        <option value="">Appel : tous</option>
                        <option value="0">Non appelé</option>
                        <option value="1">Appelé</option>
                      </select>
                    </div>

                    {/* VISIBILITÉ DES COLONNES */}
                    <div className="columnsPanel">
                      <div className="columnsPanel__head">
                        <div>
                          <strong>Colonnes à afficher</strong>
                          <br />
                          <small>
                            {visibleColumns.length} / {ALL_COLUMNS.length}{" "}
                            colonnes visibles
                          </small>
                        </div>

                        <div className="columnsPanel__actions">
                          <button type="button" onClick={showImportantColumns}>
                            Importantes
                          </button>
                          <button type="button" onClick={showAllColumns}>
                            Tout afficher
                          </button>
                          <button type="button" onClick={hideOptionalColumns}>
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
                )}
              </div>

              <div className="listFichesActions">
                <button
                  className="listBtnPrimary"
                  onClick={() => setShowAddForm(true)}
                >
                  <i className="bi bi-plus-lg" />
                  Ajouter une fiche
                </button>

                {Object.keys(dirtyFiches).length > 0 && (
                  <button className="listBtnSubmit" onClick={() => saveAll()}>
                    <i className="bi bi-check2" /> Enregistrer les modifications
                  </button>
                )}
              </div>

              {loadingFiche ? (
                <div className="listState">
                  <i className="bi bi-hourglass-split" />
                  Chargement des fiches...
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="fiche-table-fixed">
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
                                  cursor:
                                    key === "phone" ? "default" : "pointer",
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
                                          padding: "6px 24px 6px 8px",
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
                                            <option value="0">
                                              Non appelé
                                            </option>
                                            <option value="1">Appelé</option>
                                          </>
                                        ) : key === "isBlackList" ? (
                                          <>
                                            <option value="1">Whitelist</option>
                                            <option value="2">Blacklist</option>
                                          </>
                                        ) : (
                                          <>
                                            <option value="0">
                                              Non envoyé
                                            </option>
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
                                    {key === "isAlreadyCalled" ? (
                                      <span
                                        className={`ficheStatusTag ${
                                          (dirtyFiches[row._id]?.[key] ??
                                            row[key]) == 1
                                            ? "ficheStatusTag--called"
                                            : "ficheStatusTag--notCalled"
                                        }`}
                                      >
                                        {(dirtyFiches[row._id]?.[key] ??
                                          row[key]) == 1
                                          ? "Appelé"
                                          : "Non appelé"}
                                      </span>
                                    ) : key === "isBlackList" ? (
                                      <span
                                        className={`ficheStatusTag ${
                                          (dirtyFiches[row._id]?.[key] ??
                                            row[key] ??
                                            1) == 2
                                            ? "ficheStatusTag--black"
                                            : "ficheStatusTag--white"
                                        }`}
                                      >
                                        {(dirtyFiches[row._id]?.[key] ??
                                          row[key] ??
                                          1) == 2
                                          ? "Blacklist"
                                          : "Whitelist"}
                                      </span>
                                    ) : key === "emailEnvoye" ? (
                                      <span
                                        className={`ficheStatusTag ${
                                          (dirtyFiches[row._id]?.[key] ??
                                            row[key] ??
                                            0) == 1
                                            ? "ficheStatusTag--sent"
                                            : "ficheStatusTag--notSent"
                                        }`}
                                      >
                                        {(dirtyFiches[row._id]?.[key] ??
                                          row[key] ??
                                          0) == 1
                                          ? "Envoyé"
                                          : "Non envoyé"}
                                      </span>
                                    ) : (
                                      (dirtyFiches[row._id]?.[key] ?? row[key])
                                    )}
                                  </>
                                )}
                              </td>
                            ))}

                            <td>
                              <button
                                className="listIconBtn"
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

                  <div className="listPagination">
                    <div>Total : {ficheTotalResults} fiches</div>

                    <div className="listPagination__controls">
                      <button
                        className="listPagBtn"
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
                        className="listPagBtn"
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
                        className="listSelect"
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
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------- MODALE AJOUT FICHE */}
      {showAddForm && (
        <div className="listModalOverlay" onClick={() => setShowAddForm(false)}>
          <div
            className="listModal listModal--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="listModal__header">
              <div className="listModal__headerLeft">
                <span className="listModal__badge">
                  <i className="bi bi-person-plus" />
                </span>
                <div>
                  <h2>Ajouter une fiche</h2>
                  <p>{selectedList?.nomFiche}</p>
                </div>
              </div>
              <button
                type="button"
                className="listModal__close"
                onClick={() => setShowAddForm(false)}
                aria-label="Fermer"
              >
                <i className="bi bi-x-lg" />
              </button>
            </header>

            <div className="listModal__body">
              <div className="listFormGrid">
                <div className="listFieldBlock">
                  <label className="listLabel">Nom *</label>
                  <input
                    className="listTextInput"
                    placeholder="Nom"
                    value={newFiche.nom}
                    onChange={(e) =>
                      setNewFiche({ ...newFiche, nom: e.target.value })
                    }
                  />
                </div>

                <div className="listFieldBlock">
                  <label className="listLabel">Nom responsable</label>
                  <input
                    className="listTextInput"
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

                <div className="listFieldBlock">
                  <label className="listLabel">Téléphone responsable</label>
                  <input
                    className="listTextInput"
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

                <div className="listFieldBlock">
                  <label className="listLabel">Téléphone *</label>
                  <input
                    className="listTextInput"
                    placeholder="Téléphone"
                    value={newFiche.phone}
                    onChange={(e) =>
                      setNewFiche({ ...newFiche, phone: e.target.value })
                    }
                  />
                </div>

                <div className="listFieldBlock">
                  <label className="listLabel">Téléphone 2</label>
                  <input
                    className="listTextInput"
                    placeholder="Téléphone 2"
                    value={newFiche.phone2}
                    onChange={(e) =>
                      setNewFiche({ ...newFiche, phone2: e.target.value })
                    }
                  />
                </div>

                <div className="listFieldBlock">
                  <label className="listLabel">Email</label>
                  <input
                    className="listTextInput"
                    placeholder="Email"
                    value={newFiche.email}
                    onChange={(e) =>
                      setNewFiche({ ...newFiche, email: e.target.value })
                    }
                  />
                </div>

                <div className="listFieldBlock">
                  <label className="listLabel">Ville</label>
                  <input
                    className="listTextInput"
                    placeholder="Ville"
                    value={newFiche.ville}
                    onChange={(e) =>
                      setNewFiche({ ...newFiche, ville: e.target.value })
                    }
                  />
                </div>

                <div className="listFieldBlock">
                  <label className="listLabel">Habitation</label>
                  <input
                    className="listTextInput"
                    placeholder="Habitation"
                    value={newFiche.habitation}
                    onChange={(e) =>
                      setNewFiche({ ...newFiche, habitation: e.target.value })
                    }
                  />
                </div>

                <div className="listFieldBlock">
                  <label className="listLabel">Âge</label>
                  <input
                    className="listTextInput"
                    placeholder="Âge"
                    value={newFiche.age}
                    onChange={(e) =>
                      setNewFiche({ ...newFiche, age: e.target.value })
                    }
                  />
                </div>

                <div className="listFieldBlock">
                  <label className="listLabel">Effectif</label>
                  <input
                    className="listTextInput"
                    placeholder="Effectif"
                    value={newFiche.effectif}
                    onChange={(e) =>
                      setNewFiche({ ...newFiche, effectif: e.target.value })
                    }
                  />
                </div>

                <div className="listFieldBlock">
                  <label className="listLabel">Code postal</label>
                  <input
                    className="listTextInput"
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

                <div className="listFieldBlock">
                  <label className="listLabel">Entreprise</label>
                  <input
                    className="listTextInput"
                    placeholder="Entreprise"
                    value={newFiche.entreprise}
                    onChange={(e) =>
                      setNewFiche({ ...newFiche, entreprise: e.target.value })
                    }
                  />
                </div>

                <div className="listFieldBlock">
                  <label className="listLabel">Pays</label>
                  <input
                    className="listTextInput"
                    placeholder="Pays"
                    value={newFiche.pays}
                    onChange={(e) =>
                      setNewFiche({ ...newFiche, pays: e.target.value })
                    }
                  />
                </div>

                <div className="listFieldBlock listFormGrid--full">
                  <label className="listLabel">Commentaire</label>
                  <textarea
                    className="listTextarea"
                    rows="3"
                    placeholder="Commentaire"
                    value={newFiche.commentaire}
                    onChange={(e) =>
                      setNewFiche({ ...newFiche, commentaire: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <footer className="listModal__footer">
              <button
                className="listBtnGhost"
                onClick={() => setShowAddForm(false)}
              >
                Annuler
              </button>

              <button
                className="listBtnSubmit"
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
            </footer>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- MODALE IMPORT CSV */}
      {modalOpen && (
        <div className="listModalOverlay" onClick={() => setModalOpen(false)}>
          <div
            className="listModal listModal--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="listModal__header">
              <div className="listModal__headerLeft">
                <span className="listModal__badge">
                  <i className="bi bi-filetype-csv" />
                </span>
                <div>
                  <h2>Importer un CSV</h2>
                  <p>Créez une nouvelle liste de fiches</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="listModal__close"
                aria-label="Fermer"
              >
                <i className="bi bi-x-lg" />
              </button>
            </header>

            <div className="listModal__body">
              <div className="listFieldBlock">
                <label className="listLabel">Nom de la fiche *</label>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="Ex: Prospects Paris Avril"
                  className="listTextInput"
                />
              </div>

              <div className="listFieldBlock">
                <label className="listLabel">Fichier CSV</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFile}
                  className="listFileInput"
                />
                {csvData.length > 0 && (
                  <span className="listImportPreview">
                    <i className="bi bi-check-circle-fill" />
                    {csvData.length} lignes détectées · {columns.length}{" "}
                    colonnes
                  </span>
                )}
              </div>

              {columns.length > 0 && (
                <>
                  <h4 className="listMappingTitle">
                    <i className="bi bi-diagram-3" />
                    Mapping des colonnes
                  </h4>

                  <div className="listMappingGrid">
                    {mappingFields.map((field) => (
                      <div key={field.key} className="listMappingItem">
                        <label className="listLabel">{field.label}</label>

                        <select
                          value={mapping[field.key]}
                          onChange={(e) => {
                            setMapping({
                              ...mapping,
                              [field.key]: e.target.value,
                            });
                          }}
                          className="listSelect"
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
                </>
              )}
            </div>

            {columns.length > 0 && (
              <footer className="listModal__footer">
                <button
                  className="listBtnGhost"
                  onClick={() => setModalOpen(false)}
                >
                  Annuler
                </button>

                <button
                  onClick={handleCreate}
                  className="listBtnSubmit"
                  disabled={loadingCreate}
                >
                  {loadingCreate ? (
                    <>
                      <span className="loadingSpinner" /> Création...
                    </>
                  ) : (
                    "Créer la liste"
                  )}
                </button>
              </footer>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- MODALE MODIFIER NOM */}
      {editList && (
        <div className="listModalOverlay" onClick={() => setEditList(null)}>
          <div className="listModal" onClick={(e) => e.stopPropagation()}>
            <header className="listModal__header">
              <div className="listModal__headerLeft">
                <span className="listModal__badge">
                  <i className="bi bi-pencil-square" />
                </span>
                <div>
                  <h2>Modifier le nom</h2>
                  <p>{editList?.nomFiche}</p>
                </div>
              </div>
              <button
                className="listModal__close"
                onClick={() => setEditList(null)}
                aria-label="Fermer"
              >
                <i className="bi bi-x-lg" />
              </button>
            </header>

            <div className="listModal__body">
              <div className="listFieldBlock">
                <label className="listLabel">Nom de la fiche</label>
                <input
                  className="listTextInput"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nom de la fiche"
                />
              </div>
            </div>

            <footer className="listModal__footer">
              <button
                className="listBtnGhost"
                onClick={() => setEditList(null)}
              >
                Annuler
              </button>

              <button className="listBtnSubmit" onClick={handleUpdateName}>
                Sauvegarder
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- MODALE SUPPRIMER LISTE */}
      {deleteModal.open && (
        <div className="listModalOverlay">
          <div className="listDeleteModal">
            <span className="listDeleteModal__icon">
              <i className="bi bi-exclamation-triangle" />
            </span>
            <h3>Supprimer la liste</h3>

            <p>
              Voulez-vous vraiment supprimer{" "}
              <strong>{deleteModal.list?.nomFiche || "cette liste"}</strong> ?
              Cette action est irréversible.
            </p>

            <div className="listDeleteModal__actions">
              <button
                className="listBtnGhost"
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
                className="listBtnDanger"
                onClick={confirmDelete}
                disabled={deleteModal.loading}
              >
                {deleteModal.loading ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- MODALE SUPPRIMER FICHE */}
      {deleteFicheModal.open && (
        <div className="listModalOverlay">
          <div className="listDeleteModal">
            <span className="listDeleteModal__icon">
              <i className="bi bi-exclamation-triangle" />
            </span>
            <h3>Confirmation suppression</h3>

            <p>Voulez-vous supprimer cette fiche ?</p>

            <div className="listDeleteModal__actions">
              <button
                className="listBtnGhost"
                onClick={() =>
                  setDeleteFicheModal({ open: false, fiche: null })
                }
              >
                Annuler
              </button>

              <button
                className="listBtnDanger"
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
