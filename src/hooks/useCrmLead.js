import crmLeadServices from "../services/crmLeadServices.js";

export default function useCrmLead() {
  const getCrmLeads = async (params) => {
    return crmLeadServices.getAll(params);
  };

  const getOneCrmLead = async (id) => {
    return crmLeadServices.getOne(id);
  };

  const createCrmLead = async (data) => {
    return crmLeadServices.create(data);
  };

  const updateCrmLead = async (id, data) => {
    return crmLeadServices.update(id, data);
  };

  const deleteCrmLead = async (id) => {
    return crmLeadServices.delete(id);
  };

  return {
    getCrmLeads,
    getOneCrmLead,
    createCrmLead,
    updateCrmLead,
    deleteCrmLead,
  };
}