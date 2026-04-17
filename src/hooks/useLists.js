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

  return {
    getLists,
    getList,
    createList,
    updateList,
    deleteList,
  };
}