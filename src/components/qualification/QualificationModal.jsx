import React, { useEffect, useState } from "react";
import useQualification from "../../hooks/useQualification";
import "../../assets/css/QualificationModal.css";

const defaultForm = {
  code: "",
  label: "",
  statusValue: "",
  ordre: "",
  active: 1,
};

export default function QualificationModal({
  open,
  onClose,
  compagne,
  showToast,
}) {
  const {
    getQualificationsByCompagne,
    createQualification,
    updateQualification,
    deleteQualification,
    createDefaultQualifications,
  } = useQualification();

  const [qualifications, setQualifications] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [selectedQualification, setSelectedQualification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchQualifications = async () => {
    if (!compagne?._id) return;

    try {
      setLoading(true);

      const res = await getQualificationsByCompagne(compagne._id);
      const data = res?.data?.data || [];

      setQualifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur récupération qualifications :", error);
      setQualifications([]);
      showToast?.("Erreur récupération qualifications", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && compagne?._id) {
      fetchQualifications();
      setForm(defaultForm);
      setSelectedQualification(null);
    }
  }, [open, compagne?._id]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setSelectedQualification(null);
  };

  const handleEdit = (qualification) => {
    setSelectedQualification(qualification);

    setForm({
      code: qualification.code || "",
      label: qualification.label || "",
      statusValue:
        qualification.statusValue !== undefined
          ? String(qualification.statusValue)
          : "",
      ordre:
        qualification.ordre !== undefined ? String(qualification.ordre) : "",
      active: qualification.active ?? 1,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!compagne?._id) {
      showToast?.("Campagne introuvable", "danger");
      return;
    }

    if (!form.code.trim()) {
      showToast?.("Le code est obligatoire", "warning");
      return;
    }

    if (!form.label.trim()) {
      showToast?.("Le libellé est obligatoire", "warning");
      return;
    }

    if (form.statusValue === "" || form.statusValue === null) {
      showToast?.("La valeur historique est obligatoire", "warning");
      return;
    }

    const payload = {
      campagneId: compagne._id,
      code: form.code.trim().toUpperCase(),
      label: form.label.trim(),
      statusValue: Number(form.statusValue),
      ordre: Number(form.ordre || 0),
      active: Number(form.active),
    };

    try {
      setSaving(true);

      if (selectedQualification?._id) {
        await updateQualification(selectedQualification._id, payload);
        await fetchQualifications();

        showToast?.("Qualification modifiée avec succès", "success");
      } else {
        await createQualification(payload);
        await fetchQualifications();

        showToast?.("Qualification ajoutée avec succès", "success");
      }

      resetForm();
    } catch (error) {
      console.error("Erreur enregistrement qualification :", error);
      console.log("STATUS :", error?.response?.status);
      console.log("DATA :", error?.response?.data);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Erreur lors de l'enregistrement";

      showToast?.(message, "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (qualification) => {
    const confirmDelete = window.confirm(
      `Supprimer la qualification ${qualification.code} ?`
    );

    if (!confirmDelete) return;

    try {
      setSaving(true);

      await deleteQualification(qualification._id);
      await fetchQualifications();

      showToast?.("Qualification supprimée", "success");

      if (selectedQualification?._id === qualification._id) {
        resetForm();
      }
    } catch (error) {
      console.error("Erreur suppression qualification :", error);
      showToast?.("Erreur lors de la suppression", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDefaults = async () => {
    if (!compagne?._id) {
      showToast?.("Campagne introuvable", "danger");
      return;
    }

    try {
      setSaving(true);

      await createDefaultQualifications(compagne._id);
      await fetchQualifications();

      showToast?.("Qualifications par défaut ajoutées", "success");
    } catch (error) {
      console.error("Erreur ajout qualifications par défaut :", error);

      const message =
        error?.response?.data?.message ||
        "Erreur ajout qualifications par défaut";

      showToast?.(message, "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qualificationOverlay">
      <div className="qualificationModal">
        <div className="qualificationHeader">
          <div>
            <h3>Qualifications</h3>
            <p>
              Campagne :{" "}
              <strong>{compagne?.nomCompagne || "Campagne"}</strong>
            </p>
          </div>

          <button type="button" className="qualificationClose" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="qualificationBody">
          <form className="qualificationForm" onSubmit={handleSubmit}>
            <div className="qualificationFormTitle">
              {selectedQualification
                ? "Modifier une qualification"
                : "Ajouter une qualification"}
            </div>

            <div className="qualificationGridForm">
              <div className="formGroup">
                <label>Code IA</label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="Ex: SALE"
                  disabled={saving}
                />
              </div>

              <div className="formGroup">
                <label>Libellé</label>
                <input
                  type="text"
                  name="label"
                  value={form.label}
                  onChange={handleChange}
                  placeholder="Ex: Rendez-vous confirmé"
                  disabled={saving}
                />
              </div>

              <div className="formGroup">
                <label>Valeur historique</label>
                <input
                  type="number"
                  name="statusValue"
                  value={form.statusValue}
                  onChange={handleChange}
                  placeholder="Ex: 2"
                  disabled={saving}
                />
              </div>

              <div className="formGroup">
                <label>Ordre</label>
                <input
                  type="number"
                  name="ordre"
                  value={form.ordre}
                  onChange={handleChange}
                  placeholder="Ex: 1"
                  disabled={saving}
                />
              </div>

              <div className="formGroup">
                <label>Statut</label>
                <select
                  name="active"
                  value={form.active}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value={1}>Actif</option>
                  <option value={0}>Inactif</option>
                </select>
              </div>
            </div>

            <div className="qualificationActions">
              <button
                type="button"
                className="btnGhost"
                onClick={resetForm}
                disabled={saving}
              >
                Réinitialiser
              </button>

              <button type="submit" className="btnPrimary" disabled={saving}>
                {saving
                  ? "Enregistrement..."
                  : selectedQualification
                    ? "Modifier"
                    : "Ajouter"}
              </button>
            </div>
          </form>

          <div className="qualificationListBox">
            <div className="qualificationListHeader">
              <h4>Liste des qualifications</h4>

              <button
                type="button"
                className="btnDefaultQualifications"
                onClick={handleAddDefaults}
                disabled={saving}
              >
                <i className="bi bi-magic" /> Ajouter par défaut
              </button>
            </div>

            {loading ? (
              <div className="qualificationEmpty">
                Chargement des qualifications...
              </div>
            ) : qualifications.length === 0 ? (
              <div className="qualificationEmpty">
                Aucune qualification pour cette campagne.
              </div>
            ) : (
              <div className="qualificationTableWrapper">
                <table className="qualificationTable">
                  <thead>
                    <tr>
                      <th>Code IA</th>
                      <th>Libellé</th>
                      <th>Valeur</th>
                      <th>Ordre</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {qualifications
                      .slice()
                      .sort(
                        (a, b) =>
                          Number(a.ordre || 0) - Number(b.ordre || 0)
                      )
                      .map((qualification) => (
                        <tr key={qualification._id}>
                          <td>
                            <span className="qualificationCode">
                              {qualification.code}
                            </span>
                          </td>

                          <td>{qualification.label}</td>

                          <td>{qualification.statusValue}</td>

                          <td>{qualification.ordre || 0}</td>

                          <td>
                            <span
                              className={
                                Number(qualification.active) === 1
                                  ? "badgeActive"
                                  : "badgeInactive"
                              }
                            >
                              {Number(qualification.active) === 1
                                ? "Actif"
                                : "Inactif"}
                            </span>
                          </td>

                          <td>
                            <div className="tableActions">
                              <button
                                type="button"
                                className="btnIconEdit"
                                onClick={() => handleEdit(qualification)}
                                disabled={saving}
                              >
                                <i className="bi bi-pencil-square" />
                              </button>

                              <button
                                type="button"
                                className="btnIconDelete"
                                onClick={() => handleDelete(qualification)}
                                disabled={saving}
                              >
                                <i className="bi bi-trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="qualificationFooter">
          <button type="button" className="btnGhost" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}