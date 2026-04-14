import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function HeaderBar() {
  const location = useLocation();

  return (
    <header className="agentHeader">
      <div className="agentHeaderLeft">
        <div className="agentLogo">AI Agent Manager</div>
      </div>

      <div className="agentHeaderRight">
        <Link
          to="/"
          className={`headerLink ${location.pathname === "/" ? "active" : ""}`}
        >
          Agents
        </Link>

        <Link
          to="/campagnes"
          className={`headerLink ${location.pathname === "/campagnes" ? "active" : ""}`}
        >
          Campagnes
        </Link>

        <Link
          to="/tester"
          className={`headerLink ${location.pathname === "/tester" ? "active" : ""}`}
        >
          Test profil
        </Link>
      </div>
    </header>
  );
}