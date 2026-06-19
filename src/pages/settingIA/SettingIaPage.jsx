import React, { useEffect, useState } from "react";
import HeaderBar from "../../components/agents/HeaderBar";
import useSettingIa from "../../hooks/useSettingIa";
import "../../assets/css/SettingIaPage.css";

export default function SettingIaPage({ showToast }) {
  const { getSettings, updateSettings } = useSettingIa();

  const [form, setForm] = useState({
    startHour: "08:00",
    endHour: "21:00",
    timeZone: "Europe/Paris",
  });

  const [loading, setLoading] = useState(false);

  const loadSettings = async () => {
    try {
      const res = await getSettings();

      setForm({
        startHour: res.data.data.startHour || "08:00",
        endHour: res.data.data.endHour || "21:00",
        timeZone: res.data.data.timeZone || "Europe/Paris",
      });
    } catch (error) {
      showToast("Erreur chargement paramètres", "danger");
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.startHour >= form.endHour) {
      return showToast(
        "L’heure début doit être inférieure à l’heure fin",
        "warning",
      );
    }

    try {
      setLoading(true);
      await updateSettings(form);
      showToast("Paramètres enregistrés", "success");
    } catch (error) {
      showToast("Erreur sauvegarde paramètres", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settingIaPage">
      <HeaderBar />

      <div className="agentsContainer">
        <div className="agentsTopBar">
          <div>
            <h1>Paramètres IA</h1>
            <p>Configuration des horaires d’appel</p>
          </div>
        </div>

        <div className="settingIaWrapper">
          <div className="card shadow-sm border-0 settingIaCard">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Heure début</label>
                  <input
                    type="time"
                    className="form-control"
                    value={form.startHour}
                    onChange={(e) =>
                      setForm({ ...form, startHour: e.target.value })
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Heure fin</label>
                  <input
                    type="time"
                    className="form-control"
                    value={form.endHour}
                    onChange={(e) =>
                      setForm({ ...form, endHour: e.target.value })
                    }
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Fuseau horaire</label>
                  <select
                    className="form-select"
                    value={form.timeZone}
                    onChange={(e) =>
                      setForm({ ...form, timeZone: e.target.value })
                    }
                  >
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Indian/Antananarivo">Madagascar</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="settingIaSaveBtn"
                  disabled={loading}
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}