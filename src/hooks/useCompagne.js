import CompagneServices, { api } from "../services/compagneServices.js";

export default function useCompagne() {
  const service = new CompagneServices(api);

  const getCompagnes = async () => {
    return await service.getAll();
  };

  const getCompagne = async (id) => {
    return await service.getOne(id);
  };

  const createCompagne = async (data) => {
    return await service.create(data);
  };

  const updateCompagne = async (id, data) => {
    return await service.update(id, data);
  };

  const deleteCompagne = async (id) => {
    return await service.delete(id);
  };

  const lancerCompagne = async (id) => {
    return await service.lancerAppelCompagne(id);
  }

  return {
    getCompagnes,
    getCompagne,
    createCompagne,
    updateCompagne,
    deleteCompagne,
    lancerCompagne
  };
}