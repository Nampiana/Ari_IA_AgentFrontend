import axios from "axios";
import { ApiUrl, header } from "../utils/modules.js";

class ScheduledCallServices {

  // ─────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────

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

  // ─────────────────────────────────────────────
  // Création manuelle d'un rappel
  // ─────────────────────────────────────────────

  createManual(data) {
    /**
     * data = {
     *   historiqueId,
     *   reason,
     *   scheduledAt
     * }
     */
    return axios.post(
      ApiUrl + "scheduled-calls/manual",
      data,
      header()
    );
  }

  // ─────────────────────────────────────────────
  // Annulation d'un rappel
  // ─────────────────────────────────────────────

  cancel(id) {
    return axios.patch(
      ApiUrl + `scheduled-calls/${id}/cancel`,
      {},
      header()
    );
  }

  // ─────────────────────────────────────────────
  // Dashboard / statistiques
  // ─────────────────────────────────────────────

  getStats() {
    return axios.get(
      ApiUrl + "scheduled-calls/stats/summary",
      header()
    );
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  getPending(params = {}) {
    return axios.get(
      ApiUrl + "scheduled-calls",
      {
        ...header(),
        params: {
          status: "pending",
          ...params,
        },
      }
    );
  }

  getRunning(params = {}) {
    return axios.get(
      ApiUrl + "scheduled-calls",
      {
        ...header(),
        params: {
          status: "running",
          ...params,
        },
      }
    );
  }

  getDone(params = {}) {
    return axios.get(
      ApiUrl + "scheduled-calls",
      {
        ...header(),
        params: {
          status: "done",
          ...params,
        },
      }
    );
  }

  getFailed(params = {}) {
    return axios.get(
      ApiUrl + "scheduled-calls",
      {
        ...header(),
        params: {
          status: "failed",
          ...params,
        },
      }
    );
  }

  // ─────────────────────────────────────────────
  // Filtrage métier
  // ─────────────────────────────────────────────

  getByReason(reason, params = {}) {
    return axios.get(
      ApiUrl + "scheduled-calls",
      {
        ...header(),
        params: {
          reason,
          ...params,
        },
      }
    );
  }

  getByPhone(calledNumber) {
    return axios.get(
      ApiUrl +
        `scheduled-calls?calledNumber=${encodeURIComponent(
          calledNumber
        )}`,
      header()
    );
  }

  getByAgent(agentIaId, params = {}) {
    return axios.get(
      ApiUrl + "scheduled-calls",
      {
        ...header(),
        params: {
          agentIaId,
          ...params,
        },
      }
    );
  }

  getByCampagne(campagneId, params = {}) {
    return axios.get(
      ApiUrl + "scheduled-calls",
      {
        ...header(),
        params: {
          campagneId,
          ...params,
        },
      }
    );
  }
}

export default new ScheduledCallServices();