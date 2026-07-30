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

// Couleur cyclique stable pour la puce "Valeur historique" : chaque valeur
// garde toujours la même couleur d'une session à l'autre.
const valueColorClass = (value) => {
  const n = Math.abs(Number(value) || 0) % 5;
  return `qk-value qk-value--${n}`;
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

  const setActive = (value) => {
    setForm((prev) => ({ ...prev, active: value }));
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
      `Supprimer la qualification ${qualification.code} ?`,
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

      await createDefaultQualifications({
        campagneId: compagne._id,
      });

      await fetchQualifications();

      showToast?.("Qualifications par défaut ajoutées", "success");
    } catch (error) {
      console.error("Erreur ajout qualifications par défaut :", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Erreur ajout qualifications par défaut";

      showToast?.(message, "danger");
    } finally {
      setSaving(false);
    }
  };

  const sortedQualifications = qualifications
    .slice()
    .sort((a, b) => Number(a.ordre || 0) - Number(b.ordre || 0));

  return (
    <div
      className="qk-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="qk-modal">
        {/* HEADER */}
        <div className="qk-header">
          <div>
            <span className="qk-eyebrow">Configuration IA</span>
            <h3 className="qk-title">Qualifications d'appel</h3>
            <p className="qk-subtitle">
              Ce que l'IA détecte pendant l'appel, campagne{" "}
              <strong>{compagne?.nomCompagne || "sans nom"}</strong>
            </p>
          </div>

          <button
            type="button"
            className="qk-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="qk-body">
          {/* FORM */}
          <form className="qk-formCard" onSubmit={handleSubmit}>
            <div
              className={`qk-formTitle ${selectedQualification ? "is-editing" : ""}`}
            >
              {selectedQualification ? "✎ Modifier le code" : "+ Nouveau code"}
            </div>

            <div className="qk-field qk-codeField">
              <label>Code IA</label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="Ex: SALE"
                disabled={saving}
                autoComplete="off"
              />
              {form.code.trim() && (
                <span className="qk-codePreview">
                  {form.code.trim().toUpperCase()}
                </span>
              )}
            </div>

            <div className="qk-field">
              <label>Libellé affiché</label>
              <input
                type="text"
                name="label"
                value={form.label}
                onChange={handleChange}
                placeholder="Ex: Rendez-vous confirmé"
                disabled={saving}
                autoComplete="off"
              />
            </div>

            <div className="qk-fieldRow">
              <div className="qk-field">
                <label>Valeur historique</label>
                <input
                  type="number"
                  name="statusValue"
                  value={form.statusValue}
                  onChange={handleChange}
                  placeholder="2"
                  disabled={saving}
                />
              </div>

              <div className="qk-field">
                <label>Ordre</label>
                <input
                  type="number"
                  name="ordre"
                  value={form.ordre}
                  onChange={handleChange}
                  placeholder="1"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="qk-field">
              <label>Statut</label>
              <div className="qk-segment">
                <button
                  type="button"
                  data-state="active"
                  className={Number(form.active) === 1 ? "is-active" : ""}
                  onClick={() => setActive(1)}
                  disabled={saving}
                >
                  Actif
                </button>
                <button
                  type="button"
                  data-state="inactive"
                  className={Number(form.active) === 0 ? "is-active" : ""}
                  onClick={() => setActive(0)}
                  disabled={saving}
                >
                  Inactif
                </button>
              </div>
            </div>

            <div className="qk-formActions">
              <button
                type="button"
                className="qk-btn qk-btnGhost"
                onClick={resetForm}
                disabled={saving}
              >
                Réinitialiser
              </button>

              <button
                type="submit"
                className="qk-btn qk-btnPrimary"
                disabled={saving}
              >
                {saving
                  ? "Enregistrement..."
                  : selectedQualification
                    ? "Modifier"
                    : "Ajouter"}
              </button>
            </div>
          </form>

          {/* LIST */}
          <div className="qk-listPanel">
            <div className="qk-listHeader">
              <div className="qk-listHeading">
                <h4>Codes configurés</h4>
                {!loading && (
                  <span className="qk-count">{qualifications.length}</span>
                )}
              </div>

              <button
                type="button"
                className="qk-btnDefaults"
                onClick={handleAddDefaults}
                disabled={saving}
              >
                <i className="bi bi-magic" /> Ajouter les codes par défaut
              </button>
            </div>

            {loading ? (
              <div className="qk-loading">
                <div className="qk-skeleton" />
                <div className="qk-skeleton" />
                <div className="qk-skeleton" />
              </div>
            ) : sortedQualifications.length === 0 ? (
              <div className="qk-empty">
                <strong>Aucun code pour l'instant</strong>
                Ajoutez un code pour indiquer à l'IA comment qualifier ses
                appels, ou générez la liste par défaut.
              </div>
            ) : (
              <div className="qk-rows">
                {sortedQualifications.map((qualification) => (
                  <div
                    key={qualification._id}
                    className={`qk-row ${selectedQualification?._id === qualification._id ? "is-selected" : ""}`}
                  >
                    <span className="qk-order">{qualification.ordre || 0}</span>

                    <span className="qk-code">{qualification.code}</span>

                    <span className="qk-label">
                      <span className="qk-labelText">
                        {qualification.label}
                      </span>
                    </span>

                    <span
                      className={valueColorClass(qualification.statusValue)}
                    >
                      {qualification.statusValue}
                    </span>

                    <span
                      className={`qk-status ${Number(qualification.active) === 1 ? "is-active" : "is-inactive"}`}
                    >
                      {Number(qualification.active) === 1 ? "Actif" : "Inactif"}
                    </span>

                    <span className="qk-rowActions">
                      <button
                        type="button"
                        className="qk-iconBtn qk-iconEdit"
                        onClick={() => handleEdit(qualification)}
                        disabled={saving}
                        aria-label="Modifier"
                      >
                        <i className="bi bi-pencil-square" />
                      </button>

                      <button
                        type="button"
                        className="qk-iconBtn qk-iconDelete"
                        onClick={() => handleDelete(qualification)}
                        disabled={saving}
                        aria-label="Supprimer"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="qk-footer">
          <button
            type="button"
            className="qk-btn qk-btnGhost"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
