import ScheduledCallServices from "../services/scheduledCallServices.js";

export default function useScheduledCall() {
    const getScheduledCalls = async (params = {}) => {
        return ScheduledCallServices.getAll(params);
    };

    const getScheduledCall = async (id) => {
        return ScheduledCallServices.getOne(id);
    };

    const createScheduledCall = async (data) => {
        return ScheduledCallServices.createManual(data);
    };

    const updateScheduledCall = async (id, data) => {
        return ScheduledCallServices.update(id, data);
    };

    const deleteScheduledCall = async (id) => {
        return ScheduledCallServices.delete(id);
    };

    const getScheduledCallsByHistorique = async (historiqueId) => {
        return ScheduledCallServices.getByHistorique(historiqueId);
    }

    return {
        getScheduledCalls,
        getScheduledCall,
        createScheduledCall,
        updateScheduledCall,
        deleteScheduledCall,
        getScheduledCallsByHistorique
    };
}