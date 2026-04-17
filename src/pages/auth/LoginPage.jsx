import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import "../../assets/css/LoginPage.css";
import logo from "../../assets/images/Logo_Noir-1.png";

export default function LoginPage() {
  const { login, isLoading } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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
    <div className="bodyVt">
      <div className="containerVt" id="container">
        <div className="form-container sign-in-container">
          <form onSubmit={handleSubmit} className="forms">
            <img src={logo} className="logo" alt="Logo" />

            <input
              type="email"
              name="email"
              className="inputs"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="username"
              required
            />

            <input
              type="password"
              name="password"
              className="inputs"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="aVt loginLinkBtn"
              onClick={() => {}}
            >
              Mot de passe oublié?
            </button>

            <button
              type="submit"
              className="buttonVt"
              id="loginButton"
              disabled={isLoading}
            >
              {isLoading ? "Connexion..." : "Connexion"}
            </button>
          </form>
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-right">
              <h1 className="h1Vt">IA VICITELECOM</h1>
              <p className="pVt">
                Entrez votre identifiant et votre mot de passe pour vous
                connecter.
              </p>
              <button type="button" className="buttonVt ghost">
                Tableau de bord
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}