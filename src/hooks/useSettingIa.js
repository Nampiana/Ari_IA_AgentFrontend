import SettingIaServices from "../services/settingIaServices.js";

export default function useSettingIa() {
  const getSettings = async () => {
    return SettingIaServices.getSettings();
  };

  const updateSettings = async (data) => {
    return SettingIaServices.updateSettings(data);
  };

  return {
    getSettings,
    updateSettings,
  };
}