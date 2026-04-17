import axios from "axios";
import { ApiUrl, header } from "../utils/modules.js";

class ListeServices {
  getAll() {
    return axios.get(ApiUrl + "lists", header());
  }

  getOne(id) {
    return axios.get(ApiUrl + `lists/${id}`, header());
  }

  create(data) {
    return axios.post(ApiUrl + "lists", data, header());
  }

  update(id, data) {
    return axios.put(ApiUrl + `lists/${id}`, data, header());
  }

  delete(id) {
    return axios.delete(ApiUrl + `lists/${id}`, header());
  }
}

export default new ListeServices();
