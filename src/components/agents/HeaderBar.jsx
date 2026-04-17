import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../../assets/css/HeaderBar.css";

export default function HeaderBar() {
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);

  const [open, setOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const toggleMenu = () => setOpen(!open);

  const openLogoutModal = () => {
    setOpen(false);
    setLogoutModal(true);
  };

  const closeLogoutModal = () => {
    if (!logoutLoading) {
      setLogoutModal(false);
    }
  };

  const confirmLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
    } catch (error) {
      console.error("Erreur déconnexion :", error);
    } finally {
      setLogoutLoading(false);
      setLogoutModal(false);
    }
  };

  return (
    <>
      <header className="headerBar">
        <div className="headerBarLeft">
          <div className="agentLogo"><img src="favicon.ico" alt="Logo" style={{width:"40px", height:"40px"}}/> AI Agent Manager</div>
        </div>

        <div className="burger" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className={`headerBarRight ${open ? "open" : ""}`}>
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className={`headerLink ${location.pathname === "/" ? "active" : ""}`}
          >
            Agents
          </Link>

          <Link
            to="/campagnes"
            onClick={() => setOpen(false)}
            className={`headerLink ${location.pathname === "/campagnes" ? "active" : ""}`}
          >
            Campagnes
          </Link>

          <Link
            to="/lists"
            onClick={() => setOpen(false)}
            className={`headerLink ${location.pathname === "/lists" ? "active" : ""}`}
          >
            Listes
          </Link>

          <Link
            to="/tester"
            onClick={() => setOpen(false)}
            className={`headerLink ${location.pathname === "/tester" ? "active" : ""}`}
          >
            Test profil
          </Link>

          <Link
            to="/historique"
            onClick={() => setOpen(false)}
            className={`headerLink ${location.pathname === "/historique" ? "active" : ""}`}
          >
            historique
          </Link>


          <div className="headerUserSection">
            <span className="headerUserName">
              {user?.prenom || user?.nom || "Administrateur"}
            </span>

            <button
              type="button"
              className="headerLogoutBtn"
              onClick={openLogoutModal}
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {logoutModal && (
        <div className="deleteModalOverlay">
          <div className="deleteModal">
            <h3>Déconnexion</h3>
            <p>Voulez-vous vraiment vous déconnecter ?</p>

            <div className="deleteActions">
              <button
                className="btnGhost"
                onClick={closeLogoutModal}
                disabled={logoutLoading}
              >
                Annuler
              </button>

              <button
                className="btnDelete"
                onClick={confirmLogout}
                disabled={logoutLoading}
              >
                {logoutLoading ? "Déconnexion..." : "Se déconnecter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}