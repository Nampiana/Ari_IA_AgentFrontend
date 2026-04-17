import AgentServices from "../services/agentServices.js";

export default function useAgent() {
  const getAgents = async () => {
    return AgentServices.getAll();
  };

  const getAgent = async (id) => {
    return AgentServices.getOne(id);
  };

  const createAgent = async (data) => {
    return AgentServices.create(data);
  };

  const updateAgent = async (id, data) => {
    return AgentServices.update(id, data);
  };

  const deleteAgent = async (id) => {
    return AgentServices.delete(id);
  };

  const getAgentProfileByNumber = async (calledNumber) => {
    return AgentServices.getProfileByNumber(calledNumber);
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