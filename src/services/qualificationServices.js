import axios from "axios";
import { ApiUrl, header } from "../utils/modules.js";

class QualificationServices {
  getByCompagne(compagneId) {
    return axios.get(
      ApiUrl + `qualifications?campagneId=${compagneId}`,
      header()
    );
  }

  getOne(id) {
    return axios.get(ApiUrl + `qualifications/${id}`, header());
  }

  create(data) {
    return axios.post(ApiUrl + "qualifications", data, header());
  }

  createDefaults(data) {
    return axios.post(ApiUrl + "qualifications/defaults", data, header());
  }

  update(id, data) {
    return axios.put(ApiUrl + `qualifications/${id}`, data, header());
  }

  delete(id) {
    return axios.delete(ApiUrl + `qualifications/${id}`, header());
  }
}

export default new QualificationServices();