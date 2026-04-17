import axios from "axios";
import { ApiUrl, header } from "../utils/modules.js";

class HistoriqueIaServices {
  getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query
      ? `${ApiUrl}historiques?${query}`
      : `${ApiUrl}historiques`;

    return axios.get(url, header());
  }

  getOne(id) {
    return axios.get(`${ApiUrl}historiques/${id}`, header());
  }

  create(data) {
    return axios.post(`${ApiUrl}historiques`, data, header());
  }

  update(id, data) {
    return axios.put(`${ApiUrl}historiques/${id}`, data, header());
  }

  delete(id) {
    return axios.delete(`${ApiUrl}historiques/${id}`, header());
  }
}

export default new HistoriqueIaServices();