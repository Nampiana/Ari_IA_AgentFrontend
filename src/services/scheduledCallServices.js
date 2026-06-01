import axios from "axios";
import { ApiUrl, header } from "../utils/modules.js";

class ScheduledCallServices {

  getAll(params = {}) {
    return axios.get(
      ApiUrl + "scheduled-calls",
      {
        ...header(),
        params,
      }
    );
  }

  getOne(id) {
    return axios.get(
      ApiUrl + `scheduled-calls/${id}`,
      header()
    );
  }

  update(id, data) {
    return axios.put(
      ApiUrl + `scheduled-calls/${id}`,
      data,
      header()
    );
  }

  delete(id) {
    return axios.delete(
      ApiUrl + `scheduled-calls/${id}`,
      header()
    );
  }

  createManual(data) {
    return axios.post(
      ApiUrl + "scheduled-calls/manual",
      data,
      header()
    );
  }

  getByHistorique(params) {
    return axios.get(
      ApiUrl + `scheduled-calls/history`,
      {
        ...header(),
        params,
      }
    );
  }
}

export default new ScheduledCallServices();