import axios from "axios";
import { ApiUrl } from "../utils/modules.js";

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

class AuthServices {
  constructor(apiInstance) {
    this.api = apiInstance;
  }

  login(data) {
    return this.api.post(`${ApiUrl}auth/login`, data);
  }

  logout() {
    return this.api.post(`${ApiUrl}auth/logout`);
  }

  checkToken() {
    return this.api.get(`${ApiUrl}auth/me`);
  }

  updatePassword(userId, data) {
    return this.api.patch(`${ApiUrl}auth/updateMyPassword/${userId}`, data);
  }

  forgotPassword(email) {
    return this.api.post(`${ApiUrl}auth/password/forgot`, { email });
  }

  resetPassword(token, data) {
    return this.api.patch(`${ApiUrl}auth/password/reset/${token}`, data);
  }
}

export { api };
export default new AuthServices(api);