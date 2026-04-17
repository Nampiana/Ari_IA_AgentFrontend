import HistoriqueIaServices from "../services/historiqueIaServices.js";

export default function useHistoriqueIa() {
  const getHistoriques = async (params) => {
    return HistoriqueIaServices.getAll(params);
  };

  const getHistorique = async (id) => {
    return HistoriqueIaServices.getOne(id);
  };

  const createHistorique = async (data) => {
    return HistoriqueIaServices.create(data);
  };

  const updateHistorique = async (id, data) => {
    return HistoriqueIaServices.update(id, data);
  };

  const deleteHistorique = async (id) => {
    return HistoriqueIaServices.delete(id);
  };

  return {
    getHistoriques,
    getHistorique,
    createHistorique,
    updateHistorique,
    deleteHistorique,
  };
}