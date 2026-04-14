import AgentServices, { api } from "../services/agentServices.js";

export default function useAgent() {
  const service = new AgentServices(api);

  const getAgents = async () => {
    return service.getAll();
  };

  const getAgent = async (id) => {
    return service.getOne(id);
  };

  const createAgent = async (data) => {
    return service.create(data);
  };

  const updateAgent = async (id, data) => {
    return service.update(id, data);
  };

  const deleteAgent = async (id) => {
    return service.delete(id);
  };

  const getAgentProfileByNumber = async (calledNumber) => {
    return service.getProfileByNumber(calledNumber);
  };

  return {
    getAgents,
    getAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    getAgentProfileByNumber,
  };
}