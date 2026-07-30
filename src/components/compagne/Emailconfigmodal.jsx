import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import useEmailConfig from "../../hooks/useEmailConfig";
import "../../assets/css/EmailConfigModal.css";

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

const VARIABLES = [
  { key: "nom", label: "{{nom}}", sample: "Jean Dupont" },
  { key: "entreprise", label: "{{entreprise}}", sample: "Dupont & Fils" },
  { key: "societe", label: "{{societe}}", sample: "Votre Société" },
];

const STEPS = [
  { id: "activation", label: "Activation", icon: "bi-toggle2-on" },
  { id: "smtp", label: "SMTP", icon: "bi-hdd-network" },
  { id: "template", label: "Modèle", icon: "bi-envelope-paper" },
  { id: "test", label: "Test", icon: "bi-send-check" },
];

const TEST_STATUS_LABELS = {
  idle: "Non testé",
  testing: "Envoi en cours…",
  success: "Email envoyé",
  error: "Échec de l'envoi",
};

function substituteVars(text, sampleData) {
  if (!text) return "";
  return text.replace(
    /{{\s*(\w+)\s*}}/g,
    (match, key) => sampleData[key] ?? match,
  );
}

export default function EmailConfigModal({
  open,
  onClose,
  compagne,
  showToast,
}) {
  const { getEmailConfig, saveEmailConfig, testEmailConfig } = useEmailConfig();

  const [formData, setFormData] = useState(() => getInitialFormData(null));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [hasExistingPass, setHasExistingPass] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [activeStep, setActiveStep] = useState("activation");
  const [testStatus, setTestStatus] = useState("idle"); // idle | testing | success | error

  const formRef = useRef(null);
  const sectionRefs = useRef({});

  useEffect(() => {
    if (open && compagne?._id) {
      fetchConfig();
      setActiveStep("activation");
      setTestStatus("idle");
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
      setTestStatus("testing");
      await testEmailConfig(compagne._id, testEmail);
      showToast?.("Email de test envoyé avec succès", "success");
      setTestStatus("success");
    } catch (err) {
      console.error("Erreur test email :", err);
      const message =
        err?.response?.data?.message || "Erreur lors de l'envoi du test";
      showToast?.(message, "danger");
      setTestStatus("error");
    } finally {
      setTesting(false);
    }
  };

  const goToStep = (stepId) => {
    setActiveStep(stepId);
    sectionRefs.current[stepId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const insertVariable = (varLabel) => {
    handleTemplateChange(
      "objet",
      `${formData.template.objet ? formData.template.objet + " " : ""}${varLabel}`,
    );
  };

  const sampleData = useMemo(
    () => ({
      nom: VARIABLES[0].sample,
      entreprise: VARIABLES[1].sample,
      societe: compagne?.nomCompagne || VARIABLES[2].sample,
    }),
    [compagne],
  );

  const previewSubject = substituteVars(
    formData.template.objet || "(sans objet)",
    sampleData,
  );
  const previewBody = substituteVars(formData.template.corps, sampleData);

  const stepDone = {
    activation: true,
    smtp: !!formData.smtp.host && !!formData.smtp.user,
    template: !!formData.template.objet && !!formData.template.corps,
    test: testStatus === "success",
  };

  if (!open) return null;

  return (
    <div className="mailCfgOverlay" onClick={!saving ? onClose : undefined}>
      <div className="mailCfgModal" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className="mailCfgHeader">
          <div className="mailCfgHeaderIcon">
            <i className="bi bi-envelope-at-fill" />
          </div>
          <div className="mailCfgHeaderText">
            <h2>Configuration email</h2>
            <p>{compagne?.nomCompagne || "Campagne"}</p>
          </div>
          <span
            className={`mailStatusPill ${
              formData.actif ? "mailStatusPill--on" : "mailStatusPill--off"
            }`}
          >
            {formData.actif ? "Actif" : "Inactif"}
          </span>
          <button type="button" className="mailCfgClose" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {loading ? (
          <div className="mailLoadingBox">
            <i className="bi bi-arrow-repeat" style={{ marginRight: 8 }} />
            Chargement de la configuration…
          </div>
        ) : (
          <>
            <div className="mailCfgBody">
              {/* ── Rail d'étapes ── */}
              <div className="mailRail">
                {STEPS.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    className="mailRailStep"
                    data-active={activeStep === step.id}
                    data-done={stepDone[step.id]}
                    onClick={() => goToStep(step.id)}
                    title={step.label}
                  >
                    <i className={`bi ${step.icon}`} />
                  </button>
                ))}
              </div>

              {/* ── Colonne formulaire ── */}
              <div className="mailForm" ref={formRef}>
                {/* 1. Activation */}
                <div
                  className="mailCard"
                  data-active={activeStep === "activation"}
                  ref={(el) => (sectionRefs.current.activation = el)}
                >
                  <div className="mailCardHead">
                    <span className="mailCardNum">1</span>
                    <h4>Activation</h4>
                  </div>
                  <div className="mailSwitchRow">
                    <div>
                      <strong>Envoi d'email pour cette campagne</strong>
                      <span>
                        Si désactivé, aucun email ne sera envoyé même si le
                        prospect le demande pendant l'appel.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="mailSwitch"
                      data-on={formData.actif}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          actif: !prev.actif,
                        }))
                      }
                    >
                      <span className="mailSwitchThumb" />
                    </button>
                  </div>
                </div>

                {/* 2. SMTP */}
                <div
                  className="mailCard"
                  data-active={activeStep === "smtp"}
                  ref={(el) => (sectionRefs.current.smtp = el)}
                >
                  <div className="mailCardHead">
                    <span className="mailCardNum">2</span>
                    <h4>Connexion SMTP</h4>
                  </div>
                  <div className="mailGrid">
                    <div className="mailField">
                      <label>Hôte SMTP</label>
                      <input
                        type="text"
                        placeholder="smtp.gmail.com"
                        value={formData.smtp.host}
                        onChange={(e) =>
                          handleSmtpChange("host", e.target.value)
                        }
                      />
                    </div>

                    <div className="mailField">
                      <label>Port</label>
                      <input
                        type="number"
                        placeholder="465"
                        value={formData.smtp.port}
                        onChange={(e) =>
                          handleSmtpChange("port", e.target.value)
                        }
                      />
                    </div>

                    <div className="mailField">
                      <label>Connexion sécurisée</label>
                      <select
                        value={formData.smtp.secure ? "true" : "false"}
                        onChange={(e) =>
                          handleSmtpChange("secure", e.target.value === "true")
                        }
                      >
                        <option value="true">SSL — port 465</option>
                        <option value="false">Non — port 587/25</option>
                      </select>
                    </div>

                    <div className="mailField">
                      <label>Utilisateur SMTP</label>
                      <input
                        type="text"
                        placeholder="contact@societe.com"
                        value={formData.smtp.user}
                        onChange={(e) =>
                          handleSmtpChange("user", e.target.value)
                        }
                      />
                    </div>

                    <div className="mailField mailField--full">
                      <label>Mot de passe SMTP</label>
                      <div className="mailPassWrap">
                        <input
                          type={showPass ? "text" : "password"}
                          placeholder={
                            hasExistingPass ? "••••••••••••" : "Mot de passe"
                          }
                          value={formData.smtp.pass}
                          onChange={(e) =>
                            handleSmtpChange("pass", e.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="mailPassToggle"
                          onClick={() => setShowPass((v) => !v)}
                          tabIndex={-1}
                        >
                          <i
                            className={`bi ${
                              showPass ? "bi-eye-slash" : "bi-eye"
                            }`}
                          />
                        </button>
                      </div>
                      {hasExistingPass && (
                        <span className="mailKeptChip">
                          <i className="bi bi-shield-check" />
                          Laissez vide pour conserver le mot de passe actuel
                        </span>
                      )}
                    </div>

                    <div className="mailField mailField--full">
                      <label>Nom d'expéditeur (From)</label>
                      <input
                        type="text"
                        placeholder='"Société X" <contact@societe.com>'
                        value={formData.smtp.from}
                        onChange={(e) =>
                          handleSmtpChange("from", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Template */}
                <div
                  className="mailCard"
                  data-active={activeStep === "template"}
                  ref={(el) => (sectionRefs.current.template = el)}
                >
                  <div className="mailCardHead">
                    <span className="mailCardNum">3</span>
                    <h4>Modèle d'email</h4>
                  </div>
                  <div className="mailCardHint">
                    Laissez vide pour utiliser le modèle standard par défaut.
                    Cliquez une variable pour l'ajouter à l'objet, ou tapez-la
                    directement dans le corps.
                  </div>

                  <div className="mailVarBar">
                    {VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        className="mailVarChip"
                        onClick={() => insertVariable(v.label)}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>

                  <div
                    className="mailField mailField--full"
                    style={{ marginBottom: 14 }}
                  >
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

                  <div className="mailField mailField--full">
                    <label>Corps de l'email</label>
                    <div className="mailQuillWrap">
                      <ReactQuill
                        theme="snow"
                        value={formData.template.corps}
                        onChange={(value) =>
                          handleTemplateChange("corps", value)
                        }
                        modules={QUILL_MODULES}
                        placeholder="Bonjour {{nom}}, ..."
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Test */}
                <div
                  className="mailCard"
                  data-active={activeStep === "test"}
                  ref={(el) => (sectionRefs.current.test = el)}
                >
                  <div className="mailCardHead">
                    <span className="mailCardNum">4</span>
                    <h4>Tester la configuration</h4>
                  </div>
                  <div className="mailTestRow">
                    <input
                      type="email"
                      className="mailTestInput"
                      placeholder="votre.email@exemple.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                    <button
                      type="button"
                      className="mailBtnTest"
                      onClick={handleTest}
                      disabled={testing || saving}
                    >
                      <i className="bi bi-send" />
                      {testing ? "Envoi..." : "Envoyer un test"}
                    </button>
                  </div>
                  <span className={`mailChip mailChip--${testStatus}`}>
                    {TEST_STATUS_LABELS[testStatus]}
                  </span>
                  <div className="mailTestNote">
                    <i className="bi bi-exclamation-triangle-fill" />
                    Enregistrez la configuration avant de tester : le test
                    utilise les données actuellement sauvegardées en base.
                  </div>
                </div>
              </div>

              {/* ── Colonne aperçu ── */}
              <div className="mailPreview">
                <div className="mailPreviewLabel">
                  <span className="mailPulse" />
                  Aperçu en direct
                </div>
                <div className="mailEnvelope">
                  <div className="mailEnvelopeBar">
                    <div className="mailEnvelopeRow">
                      <b>De</b>
                      <span>
                        {formData.smtp.from ||
                          formData.smtp.user ||
                          "expediteur@societe.com"}
                      </span>
                    </div>
                    <div className="mailEnvelopeRow">
                      <b>À</b>
                      <span>
                        {sampleData.nom} — {sampleData.entreprise}
                      </span>
                    </div>
                  </div>
                  <div className="mailEnvelopeSubject">
                    <small>Objet</small>
                    {previewSubject}
                  </div>
                  <div
                    className="mailEnvelopeBody"
                    dangerouslySetInnerHTML={{
                      __html: previewBody || "<p></p>",
                    }}
                  />
                </div>
                <div className="mailPreviewFoot">
                  Aperçu généré avec des données d'exemple —{" "}
                  <code>{"{{nom}}"}</code>, <code>{"{{entreprise}}"}</code> et{" "}
                  <code>{"{{societe}}"}</code> seront remplacées par les vraies
                  informations du prospect à l'envoi.
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="mailCfgFooter">
              <button
                type="button"
                className="mailBtnGhost"
                onClick={onClose}
                disabled={saving}
              >
                Fermer
              </button>
              <button
                type="button"
                className="mailBtnSave"
                onClick={handleSave}
                disabled={saving}
              >
                <i className="bi bi-check-lg" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
