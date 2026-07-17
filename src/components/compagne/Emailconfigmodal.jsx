import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import useEmailConfig from "../../hooks/useEmailConfig";

const getInitialFormData = (config) => ({
  actif: config?.actif ?? false,
  smtp: {
    host: config?.smtp?.host || "",
    port: config?.smtp?.port ?? 465,
    secure: config?.smtp?.secure ?? true,
    user: config?.smtp?.user || "",
    pass: "", // ⚠️ jamais pré-rempli, l'utilisateur ne le retape que s'il veut le changer
    from: config?.smtp?.from || "",
  },
  template: {
    objet: config?.template?.objet || "",
    corps: config?.template?.corps || "",
  },
});

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
};

export default function EmailConfigModal({
  open,
  onClose,
  compagne,
  showToast,
}) {
  const { getEmailConfig, saveEmailConfig, testEmailConfig } =
    useEmailConfig();

  const [formData, setFormData] = useState(() => getInitialFormData(null));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [hasExistingPass, setHasExistingPass] = useState(false);

  useEffect(() => {
    if (open && compagne?._id) {
      fetchConfig();
    }
  }, [open, compagne]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await getEmailConfig(compagne._id);
      const config = res?.data?.data;

      setFormData(getInitialFormData(config));
      setHasExistingPass(!!config?.smtp?.host && !!config?.smtp?.user);
    } catch (err) {
      console.error("Erreur chargement config email :", err);
      showToast?.("Erreur chargement configuration email", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleSmtpChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      smtp: { ...prev.smtp, [field]: value },
    }));
  };

  const handleTemplateChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      template: { ...prev.template, [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!compagne?._id) return;

    try {
      setSaving(true);

      const payload = {
        actif: formData.actif,
        smtp: {
          host: formData.smtp.host,
          port: Number(formData.smtp.port) || 465,
          secure: formData.smtp.secure,
          user: formData.smtp.user,
          from: formData.smtp.from,
        },
        template: {
          objet: formData.template.objet,
          corps: formData.template.corps,
        },
      };

      // Le mot de passe n'est envoyé que s'il a été retapé
      if (formData.smtp.pass) {
        payload.smtp.pass = formData.smtp.pass;
      }

      await saveEmailConfig(compagne._id, payload);

      showToast?.("Configuration email enregistrée", "success");
      setFormData((prev) => ({ ...prev, smtp: { ...prev.smtp, pass: "" } }));
      setHasExistingPass(true);
    } catch (err) {
      console.error("Erreur sauvegarde config email :", err);
      showToast?.("Erreur lors de l'enregistrement", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      showToast?.("Veuillez saisir une adresse email de test", "warning");
      return;
    }

    try {
      setTesting(true);
      await testEmailConfig(compagne._id, testEmail);
      showToast?.("Email de test envoyé avec succès", "success");
    } catch (err) {
      console.error("Erreur test email :", err);
      const message =
        err?.response?.data?.message || "Erreur lors de l'envoi du test";
      showToast?.(message, "danger");
    } finally {
      setTesting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="agentModalOverlay" onClick={!saving ? onClose : undefined}>
      <div
        className="agentModal"
        style={{ maxWidth: "760px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="agentModalHeader">
          <h2>
            Configuration email — {compagne?.nomCompagne || "Campagne"}
          </h2>
          <button type="button" className="closeBtn" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {loading ? (
          <div className="loadingBox">Chargement...</div>
        ) : (
          <div className="agentForm">
            {/* ── Activation ── */}
            <div className="formGroup full">
              <label
                className="ficheCheckItem"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <input
                  type="checkbox"
                  checked={formData.actif}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      actif: e.target.checked,
                    }))
                  }
                />
                <span>Activer l'envoi d'email pour cette campagne</span>
              </label>
              <div className="formHint">
                Si désactivé, aucun email ne sera envoyé même si le prospect
                le demande pendant l'appel.
              </div>
            </div>

            <h4 style={{ marginTop: 20, marginBottom: 10 }}>
              Configuration SMTP
            </h4>

            <div className="formGrid">
              <div className="formGroup">
                <label>Hôte SMTP</label>
                <input
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={formData.smtp.host}
                  onChange={(e) => handleSmtpChange("host", e.target.value)}
                />
              </div>

              <div className="formGroup">
                <label>Port</label>
                <input
                  type="number"
                  placeholder="465"
                  value={formData.smtp.port}
                  onChange={(e) => handleSmtpChange("port", e.target.value)}
                />
              </div>

              <div className="formGroup">
                <label>Connexion sécurisée (SSL)</label>
                <select
                  value={formData.smtp.secure ? "true" : "false"}
                  onChange={(e) =>
                    handleSmtpChange("secure", e.target.value === "true")
                  }
                >
                  <option value="true">Oui (port 465)</option>
                  <option value="false">Non (port 587/25)</option>
                </select>
              </div>

              <div className="formGroup">
                <label>Utilisateur SMTP (email)</label>
                <input
                  type="text"
                  placeholder="contact@societe.com"
                  value={formData.smtp.user}
                  onChange={(e) => handleSmtpChange("user", e.target.value)}
                />
              </div>

              <div className="formGroup">
                <label>
                  Mot de passe SMTP
                  {hasExistingPass && (
                    <span className="formHint">
                      {" "}
                      (laisser vide pour conserver l'actuel)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  placeholder={
                    hasExistingPass ? "••••••••••••" : "Mot de passe"
                  }
                  value={formData.smtp.pass}
                  onChange={(e) => handleSmtpChange("pass", e.target.value)}
                />
              </div>

              <div className="formGroup">
                <label>Nom d'expéditeur (From)</label>
                <input
                  type="text"
                  placeholder='"Société X" <contact@societe.com>'
                  value={formData.smtp.from}
                  onChange={(e) => handleSmtpChange("from", e.target.value)}
                />
              </div>
            </div>

            <h4 style={{ marginTop: 20, marginBottom: 10 }}>
              Template email
            </h4>
            <div className="formHint" style={{ marginBottom: 10 }}>
              Variables disponibles :{" "}
              <code>{"{{nom}}"}</code>, <code>{"{{entreprise}}"}</code>,{" "}
              <code>{"{{societe}}"}</code> — insérez-les directement dans le
              texte ci-dessous. Laissez vide pour utiliser le template
              standard par défaut.
            </div>

            <div className="formGroup full">
              <label>Objet de l'email</label>
              <input
                type="text"
                placeholder="{{societe}} - Présentation de nos services"
                value={formData.template.objet}
                onChange={(e) =>
                  handleTemplateChange("objet", e.target.value)
                }
              />
            </div>

            <div className="formGroup full">
              <label>Corps de l'email</label>
              <div style={{ background: "#fff", borderRadius: 6 }}>
                <ReactQuill
                  theme="snow"
                  value={formData.template.corps}
                  onChange={(value) => handleTemplateChange("corps", value)}
                  modules={QUILL_MODULES}
                  placeholder="Bonjour {{nom}}, ..."
                  style={{ minHeight: "220px" }}
                />
              </div>
              <div className="formHint" style={{ marginTop: 40 }}>
                Utilisez la barre d'outils pour mettre en forme le texte
                (gras, couleurs, listes...). Le rendu final sera envoyé tel
                quel par email.
              </div>
            </div>

            <h4 style={{ marginTop: 20, marginBottom: 10 }}>
              Tester la configuration
            </h4>
            <div
              className="formGroup full"
              style={{ display: "flex", gap: 10 }}
            >
              <input
                type="email"
                placeholder="votre.email@exemple.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btnGhost"
                onClick={handleTest}
                disabled={testing || saving}
              >
                {testing ? "Envoi..." : "Envoyer un test"}
              </button>
            </div>
            <div className="formHint">
              ⚠️ Enregistrez la configuration avant de tester, le test utilise
              les données actuellement sauvegardées en base.
            </div>

            <div className="agentModalActions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn btnGhost"
                onClick={onClose}
                disabled={saving}
              >
                Fermer
              </button>
              <button
                type="button"
                className="btn btnPrimary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}