import axios from "axios";
import { ApiUrl } from "../utils/modules.js";

class AgentServices {
  constructor(api) {
    this.api = api;
  }

  getAll() {
    return this.api.get(ApiUrl + "agents");
  }

  getOne(id) {
    return this.api.get(ApiUrl + `agents/${id}`);
  }

  create(data) {
    return this.api.post(ApiUrl + "agents", data);
  }

  update(id, data) {
    return this.api.put(ApiUrl + `agents/${id}`, data);
  }

  delete(id) {
    return this.api.delete(ApiUrl + `agents/${id}`);
  }

  getProfileByNumber(calledNumber) {
    return this.api.get(ApiUrl + `agents/profile?calledNumber=${encodeURIComponent(calledNumber)}`);
  }
}

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

export { api };
export default AgentServices;