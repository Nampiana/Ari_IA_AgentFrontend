import QualificationServices from "../services/qualificationServices.js";

export default function useQualification() {
  const getQualificationsByCompagne = async (compagneId) => {
    return QualificationServices.getByCompagne(compagneId);
  };

  const getQualification = async (id) => {
    return QualificationServices.getOne(id);
  };

  const createQualification = async (data) => {
    return QualificationServices.create(data);
  };

  const updateQualification = async (id, data) => {
    return QualificationServices.update(id, data);
  };

  const deleteQualification = async (id) => {
    return QualificationServices.delete(id);
  };

  return {
    getQualificationsByCompagne,
    getQualification,
    createQualification,
    updateQualification,
    deleteQualification,
  };
}