import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../assets/css/HeaderBar.css";

export default function HeaderBar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen(!open);

  return (
    <header className="headerBar">
      <div className="headerBarLeft">
        <div className="agentLogo">AI Agent Manager</div>
      </div>

      {/* Burger */}
      <div className="burger" onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Menu */}
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
      </div>
    </header>
  );
}