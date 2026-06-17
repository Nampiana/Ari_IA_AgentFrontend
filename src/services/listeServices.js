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

  // CRUD POUR LES FICHES
  getFichesOld(listId, page = 1, limit = 10) {
    return axios.get(
      ApiUrl + `lists/${listId}/fiches?page=${page}&limit=${limit}`,
      header(),
    );
  }

  getFiches = (listId, params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    ).toString();
    return axios.get(
      ApiUrl + `lists/${listId}/fiches?${query}`,
      header(),
    );
  };

  updateFiche(listId, ficheId, data) {
    return axios.patch(
      ApiUrl + `lists/${listId}/fiches/${ficheId}`,
      data,
      header(),
    );
  }

  deleteFiche(listId, ficheId) {
    return axios.delete(ApiUrl + `lists/${listId}/fiches/${ficheId}`, header());
  }

  addFiche(listId, data) {
    return axios.post(ApiUrl + `lists/${listId}/fiches`, data, header());
  }
}

export default new ListeServices();
