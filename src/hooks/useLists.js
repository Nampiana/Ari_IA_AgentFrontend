import ListeServices from "../services/listeServices.js";

export default function useLists() {
  const getLists = async () => {
    return ListeServices.getAll();
  };

  const getList = async (id) => {
    return ListeServices.getOne(id);
  };

  const createList = async (data) => {
    return ListeServices.create(data);
  };

  const updateList = async (id, data) => {
    return ListeServices.update(id, data);
  };

  const deleteList = async (id) => {
    return ListeServices.delete(id);
  };

  const getFiches = async (listId) => {
    return ListeServices.getFiches(listId);
  };

  const addFiche = async (listId, data) => {
    return ListeServices.addFiche(listId, data);
  };

  const updateFiche = async (listId, ficheId, data) => {
    return ListeServices.updateFiche(listId, ficheId, data);
  };

  const deleteFiche = async (listId, ficheId) => {
    return ListeServices.deleteFiche(listId, ficheId);
  };

  return {
    getLists,
    getList,
    createList,
    updateList,
    deleteList,
    getFiches,
    addFiche,
    updateFiche,
    deleteFiche,
  };
}