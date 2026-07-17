import axios from "axios";
import { ApiUrl, header } from "../utils/modules.js";

class EmailConfigServices {
  getOne(compagneId) {
    return axios.get(ApiUrl + `email-config/${compagneId}`, header());
  }

  save(compagneId, data) {
    return axios.put(ApiUrl + `email-config/${compagneId}`, data, header());
  }

  delete(compagneId) {
    return axios.delete(ApiUrl + `email-config/${compagneId}`, header());
  }

  test(compagneId, destinataire) {
    return axios.post(
      ApiUrl + `email-config/${compagneId}/test`,
      { destinataire },
      header(),
    );
  }
}

export default new EmailConfigServices();