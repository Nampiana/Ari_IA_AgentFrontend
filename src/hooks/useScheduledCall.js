import ScheduledCallServices from "../services/scheduledCallServices.js";

export default function useScheduledCall() {
    const getScheduledCalls = async (params = {}) => {
        return ScheduledCallServices.getAll(params);
    };

    const getScheduledCall = async (id) => {
        return ScheduledCallServices.getOne(id);
    };

    const createScheduledCall = async (data) => {
        return ScheduledCallServices.create(data);
    };

    const updateScheduledCall = async (id, data) => {
        return ScheduledCallServices.update(id, data);
    };

    const deleteScheduledCall = async (id) => {
        return ScheduledCallServices.delete(id);
    };

    const getByReason = async (reason, params = {}) => {
        return ScheduledCallServices.getByReason(reason, params);
    };

    const getByPhone = async (calledNumber) => {
        return ScheduledCallServices.getByPhone(calledNumber);
    };

    const getByAgent = async (agentIaId, params = {}) => {
        return ScheduledCallServices.getByAgent(agentIaId, params);
    };

    const getByCampagne = async (campagneId, params = {}) => {
        return ScheduledCallServices.getByCampagne(campagneId, params);
    };

    return {
        getScheduledCalls,
        getScheduledCall,
        createScheduledCall,
        updateScheduledCall,
        deleteScheduledCall,
        getByReason,
        getByPhone,
        getByAgent,
        getByCampagne,
    };
}