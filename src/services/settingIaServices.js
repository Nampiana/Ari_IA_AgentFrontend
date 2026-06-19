import axios from "axios";
import { ApiUrl, header } from "../utils/modules.js";

class SettingIaServices {
  getSettings() {
    return axios.get(ApiUrl + "settings-ia", header());
  }

  updateSettings(data) {
    return axios.put(ApiUrl + "settings-ia", data, header());
  }
}

export default new SettingIaServices();