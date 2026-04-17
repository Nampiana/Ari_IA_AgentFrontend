import axios from "axios";
import { ApiUrl, header } from "../utils/modules.js";

class AgentServices {
  getAll() {
    return axios.get(ApiUrl + "agents", header());
  }

  getOne(id) {
    return axios.get(ApiUrl + `agents/${id}`, header());
  }

  create(data) {
    return axios.post(ApiUrl + "agents", data, header());
  }

  update(id, data) {
    return axios.put(ApiUrl + `agents/${id}`, data, header());
  }

  delete(id) {
    return axios.delete(ApiUrl + `agents/${id}`, header());
  }

  getProfileByNumber(calledNumber) {
    return axios.get(
      ApiUrl + `agents/profile?calledNumber=${encodeURIComponent(calledNumber)}`,
      header()
    );
  }
}

export default new AgentServices();