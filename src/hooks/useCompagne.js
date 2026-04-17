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
    return await service.delete(id);
  };

  const lancerAppelCompagne = async (id) => {
    return await service.lancerAppelCompagne(id);
  }

  return {
    getCompagnes,
    getCompagne,
    createCompagne,
    updateCompagne,
    deleteCompagne,
    lancerAppelCompagne,
  };
}
