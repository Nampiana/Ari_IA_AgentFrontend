import axios from "axios";
import { ApiUrl } from "../utils/modules.js";

class CompagneServices {
  constructor(api) {
    this.api = api;
  }

  getAll() {
    return this.api.get(ApiUrl + "compagnes");
  }

  getOne(id) {
    return this.api.get(ApiUrl + `compagnes/${id}`);
  }

  create(data) {
    return this.api.post(ApiUrl + "compagnes", data);
  }

  update(id, data) {
    return this.api.put(ApiUrl + `compagnes/${id}`, data);
  }

  delete(id) {
    return this.api.delete(ApiUrl + `compagnes/${id}`);
  }

  lancerAppelCompagne(id) {
    return this.api.post(ApiUrl + `compagnes/autodialer/${id}`);
  }
}

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

export { api };
export default CompagneServices;