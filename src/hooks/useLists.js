import ListeServices, { api } from "../services/listeServices.js";

export default function useLists() {
  const service = new ListeServices(api);

  const getLists = async () => {
    return service.getAll();
  };

  const getList = async (id) => {
    return service.getOne(id);
  };

  const createList = async (data) => {
    return service.create(data);
  };

  const updateList = async (id, data) => {
    return service.update(id, data);
  };

  const deleteList = async (id) => {
    return service.delete(id);
  };

  return {
    getLists,
    getList,
    createList,
    updateList,
    deleteList,
  };
}