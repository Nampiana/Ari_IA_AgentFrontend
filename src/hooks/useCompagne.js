import CompagneServices from "../services/compagneServices.js";

export default function useCompagne() {
  const getCompagnes = async () => {
    return CompagneServices.getAll();
  };

  const getCompagne = async (id) => {
    return CompagneServices.getOne(id);
  };

  const createCompagne = async (data) => {
    return CompagneServices.create(data);
  };

  const updateCompagne = async (id, data) => {
    return CompagneServices.update(id, data);
  };

  const deleteCompagne = async (id) => {
    return CompagneServices.delete(id);
  };

  const lancerCompagne = async (id) => {
    return CompagneServices.lancerAppelCompagne(id);
  };

  return {
    getCompagnes,
    getCompagne,
    createCompagne,
    updateCompagne,
    deleteCompagne,
    lancerCompagne,
  };
}
