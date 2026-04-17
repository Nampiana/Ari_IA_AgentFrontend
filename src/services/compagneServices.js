import axios from "axios";
import { ApiUrl, header } from "../utils/modules.js";

class CompagneServices {
  getAll() {
    return axios.get(ApiUrl + "compagnes", header());
  }

  getOne(id) {
    return axios.get(ApiUrl + `compagnes/${id}`, header());
  }

  create(data) {
    return axios.post(ApiUrl + "compagnes", data, header());
  }

  update(id, data) {
    return axios.put(ApiUrl + `compagnes/${id}`, data, header());
  }

  delete(id) {
    return axios.delete(ApiUrl + `compagnes/${id}`, header());
  }

  lancerAppelCompagne(id) {
    return axios.post(ApiUrl + `compagnes/autodialer/${id}`, {}, header());
  }

  lancerAppelCompagne(id) {
    return this.api.post(ApiUrl + `compagnes/autodialer/${id}`);
  }
}

export default new CompagneServices();
