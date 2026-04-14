import axios from "axios";
import { ApiUrl } from "../utils/modules.js";

class ListeServices {
  constructor(api) {
    this.api = api;
  }

  getAll() {
    return this.api.get(ApiUrl + "lists");
  }

  getOne(id) {
    return this.api.get(ApiUrl + `lists/${id}`);
  }

  create(data) {
    return this.api.post(ApiUrl + "lists", data);
  }

  update(id, data) {
    return this.api.put(ApiUrl + `lists/${id}`, data);
  }

  delete(id) {
    return this.api.delete(ApiUrl + `lists/${id}`);
  }

}

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

export { api };
export default ListeServices;