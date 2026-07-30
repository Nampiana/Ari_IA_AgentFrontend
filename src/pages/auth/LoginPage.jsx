import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import "../../assets/css/LoginPage.css";
import logo from "../../assets/images/Logo_Noir-1.png";

const WAVE_BARS = [16, 26, 12, 32, 20, 34, 14, 24, 30, 18, 28, 15];

export default function LoginPage() {
  const { login, isLoading } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(formData);
  };

  return (
    <div className="loginPage">
      <div className="loginShell">
        {/* ── Panneau de marque ── */}
        <section className="loginBrand">
          <span
            className="loginBrand__orb loginBrand__orb--a"
            aria-hidden="true"
          />
          <span
            className="loginBrand__orb loginBrand__orb--b"
            aria-hidden="true"
          />

          <div className="loginBrand__content">
            <span className="loginBrand__eyebrow">
              <span className="loginBrand__dot" />
              Espace administrateur
            </span>

            <div className="loginBrand__mark">
              <img src={logo} className="loginLogo" alt="IA Vicitelecom" />
            </div>

            <div className="loginWave" aria-hidden="true">
              {WAVE_BARS.map((h, i) => (
                <span
                  key={i}
                  className="loginWave__bar"
                  style={{
                    height: `${h}px`,
                    animationDelay: `${i * 0.08}s`,
                    animationDuration: `${0.9 + (i % 4) * 0.12}s`,
                  }}
                />
              ))}
            </div>

            <div>
              <h1 className="loginBrand__title">IA VICITELECOM</h1>
              <p className="loginBrand__desc">
                Pilotez vos campagnes d'appels IA, suivez vos agents vocaux et
                vos leads depuis un seul tableau de bord.
              </p>
            </div>
          </div>

          <ul className="loginFeatures">
            <li className="loginFeatures__item">
              <i className="bi bi-mic-fill" />
              Agents vocaux IA
            </li>
            <li className="loginFeatures__item">
              <i className="bi bi-telephone-outbound-fill" />
              Appels automatisés &amp; manuels
            </li>
            <li className="loginFeatures__item">
              <i className="bi bi-graph-up-arrow" />
              Suivi des leads en temps réel
            </li>
          </ul>
        </section>

        {/* ── Panneau formulaire ── */}
        <section className="loginFormPanel">
          <div className="loginFormPanel__inner">
            <span className="loginEyebrow">
              <i className="bi bi-shield-lock-fill" />
              Connexion sécurisée
            </span>

            <h2 className="loginFormPanel__title">Bon retour</h2>
            <p className="loginFormPanel__sub">
              Entrez votre identifiant et votre mot de passe pour accéder au
              tableau de bord.
            </p>

            <form onSubmit={handleSubmit} className="loginForm">
              <div className="loginField">
                <i className="bi bi-envelope-fill" />
                <label htmlFor="login-email" className="visually-hidden">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="loginField loginField--password">
                <i className="bi bi-lock-fill" />
                <label htmlFor="login-password" className="visually-hidden">
                  Mot de passe
                </label>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Mot de passe"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="loginToggleVisibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  <i
                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                  />
                </button>
              </div>

              <div className="loginRow">
                <button
                  type="button"
                  className="loginLinkBtn"
                  onClick={() => {}}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit"
                className="loginSubmit"
                id="loginButton"
                disabled={isLoading}
              >
                {isLoading && <span className="loadingSpinner" />}
                {isLoading ? "Connexion..." : "Connexion"}
              </button>
            </form>

            <p className="loginFootnote">
              <i className="bi bi-lock-fill" />
              Connexion chiffrée · Accès réservé
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
