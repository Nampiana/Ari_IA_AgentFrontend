import axios from "axios";
import { ApiUrl, header } from "../utils/modules.js";

class CrmLeadServices {
  getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query
      ? `${ApiUrl}crm-leads?${query}`
      : `${ApiUrl}crm-leads`;

    return axios.get(url, header());
  }

  getOne(id) {
    return axios.get(`${ApiUrl}crm-leads/${id}`, header());
  }

  create(data) {
    return axios.post(`${ApiUrl}crm-leads`, data, header());
  }

  update(id, data) {
    return axios.put(`${ApiUrl}crm-leads/${id}`, data, header());
  }

  delete(id) {
    return axios.delete(`${ApiUrl}crm-leads/${id}`, header());
  }
}

export default new CrmLeadServices();