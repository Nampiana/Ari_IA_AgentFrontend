import EmailConfigServices from "../services/emailConfigServices.js";

export default function useEmailConfig() {
  const getEmailConfig = async (compagneId) => {
    return EmailConfigServices.getOne(compagneId);
  };

  const saveEmailConfig = async (compagneId, data) => {
    return EmailConfigServices.save(compagneId, data);
  };

  const deleteEmailConfig = async (compagneId) => {
    return await EmailConfigServices.delete(compagneId);
  };

  const testEmailConfig = async (compagneId, destinataire) => {
    return await EmailConfigServices.test(compagneId, destinataire);
  };

  return {
    getEmailConfig,
    saveEmailConfig,
    deleteEmailConfig,
    testEmailConfig,
  };
}