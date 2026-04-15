import React, { useEffect, useState } from "react";
import useLists from "../../hooks/useLists";
import HeaderBar from "../../components/agents/HeaderBar";
import Papa from "papaparse"; // npm install papaparse
import "../../assets/css/ListsPage.css";

export default function ListsPage({ showToast }) {
  const { getLists, createList, updateList, deleteList } = useLists();

  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editList, setEditList] = useState(null);
  const [newName, setNewName] = useState("");
  const [csvData, setCsvData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [mapping, setMapping] = useState({
    nom: "",
    telephone: "",
  });

  const [modalOpen, setModalOpen] = useState(false);

  // 📌 FETCH
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

  // 📁 CSV IMPORT
  const handleFile = (e) => {
    const file = e.target.files[0];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        setColumns(Object.keys(results.data[0] || {}));
      },
    });
  };

  const handleUpdateName = async () => {
    if (!editList || !newName.trim()) {
      return showToast("Nom invalide", "warning");
    }

    try {
      await updateList(editList._id, {
        nomFiche: newName,
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

  // ✅ CREATE LIST
  const handleCreate = async () => {
    if (!mapping.nom || !mapping.telephone) {
      return showToast("Mapping incomplet", "warning");
    }

    try {
      // 🔥 TRANSFORMATION ICI (IMPORTANT)
      const formattedData = csvData.map((row) => ({
        nom: row[mapping.nom],
        telephone: row[mapping.telephone],
      }));

      await createList({
        nomFiche: "Nouvelle liste",
        infoFiche: formattedData,
      });

      showToast("Liste créée avec succès", "success");

      setModalOpen(false);
      setCsvData([]);
      setColumns([]);
      setMapping({ nom: "", telephone: "" });

      fetchLists();
    } catch (err) {
      console.error(err);
      showToast("Erreur création", "danger");
    }
  };

  // ❌ DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette liste ?")) return;

    try {
      await deleteList(id);
      showToast("Liste supprimée", "success");
      fetchLists();
    } catch (err) {
      showToast("Erreur suppression", "danger");
    }
  };

  return (
    <div className="listsPage">
      <HeaderBar />

      <div className="listsContainer">
        <div className="topBar">
          <h1>Gestion des listes</h1>

          <button className="btnPrimary" onClick={() => setModalOpen(true)}>
            Import CSV
          </button>
        </div>

        {/* LIST TABLE */}
        {loading ? (
          <div className="loadingBox">Chargement...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Total fiches</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lists.map((list) => (
                <tr key={list._id}>
                  <td>{list.nomFiche}</td>
                  <td>{list.infoFiche?.length}</td>
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
                      onClick={() => handleDelete(list._id)}
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

      {/* MODAL CSV */}
      {modalOpen && (
        <>
          <div className="modalOverlay">
            <div className="insertFicheModal">
              <div className="modalInsertFicheHeader">
                <h2>Importer CSV</h2>
                <button
                  type="button"
                  className="closeBtn"
                  onClick={() => setModalOpen(false)}
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <input type="file" accept=".csv" onChange={handleFile} />

              {columns.length > 0 && (
                <>
                  <h4>Mapping</h4>
                  <div className="mappingContainer">
                    <select
                      className="form-select"
                      onChange={(e) =>
                        setMapping({ ...mapping, nom: e.target.value })
                      }
                    >
                      <option>Nom</option>
                      {columns.map((col) => (
                        <option key={col}>{col}</option>
                      ))}
                    </select>

                    <select
                      className="form-select"
                      onChange={(e) =>
                        setMapping({ ...mapping, telephone: e.target.value })
                      }
                    >
                      <option>Téléphone</option>
                      {columns.map((col) => (
                        <option key={col}>{col}</option>
                      ))}
                    </select>

                    <button className="btn btn-primary" onClick={handleCreate}>
                      Créer
                    </button>
                  </div>
                </>
              )}

              {/* <button className="btn btn-secondary mt-3" onClick={() => setModalOpen(false)}>
                Fermer
              </button> */}
            </div>
          </div>
        </>
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
    </div>
  );
}
