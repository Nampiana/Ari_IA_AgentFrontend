import React, { useState } from "react";
import useAgent from "../../hooks/useAgent";
import HeaderBar from "../../components/agents/HeaderBar";
import "../../assets/css/AgentProfileTesterPage.css";

export default function AgentProfileTesterPage() {
  const { getAgentProfileByNumber } = useAgent();

  const [calledNumber, setCalledNumber] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!calledNumber.trim()) return;

    try {
      setLoading(true);
      const res = await getAgentProfileByNumber(calledNumber);
      setProfile(res?.data?.data || null);
    } catch (error) {
      console.error("Erreur récupération profil :", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="testerPage">
      <HeaderBar />

      <div className="testerContainer">
        <div className="testerCard">
          <h1>Tester le profil retourné par l’API</h1>
          <p>
            Entrez un numéro pour tester la route :
            <strong> /api/agents/profile?calledNumber=...</strong>
          </p>

          <div className="testerInputRow">
            <input
              type="text"
              placeholder="Ex: 33568080149"
              value={calledNumber}
              onChange={(e) => setCalledNumber(e.target.value)}
            />
            <button type="button" className="btnPrimary" onClick={handleTest}>
              Tester
            </button>
          </div>

          {loading && <div className="loadingBox">Chargement du profil...</div>}

          {profile && !loading && (
            <div className="profileResultCard">
              <div className="profileTop">
                <div>
                  <h2>{profile.nomAgent}</h2>
                  <p>{profile.companyName}</p>
                </div>
                <div className="profileBadges">
                  <span className="badge success">{profile.active === 1 ? "Actif" : "Inactif"}</span>
                  {profile.isDefault === 1 && <span className="badge default">Par défaut</span>}
                </div>
              </div>

              <div className="profileGrid">
                <div>
                  <span className="label">Voix</span>
                  <div>{profile.voice}</div>
                </div>
                <div>
                  <span className="label">Style</span>
                  <div>{profile.genderStyle}</div>
                </div>
                <div>
                  <span className="label">Vitesse</span>
                  <div>{profile.speed}</div>
                </div>
                <div>
                  <span className="label">Numéros</span>
                  <div>{profile.calledNumbers?.join(", ") || "Aucun"}</div>
                </div>
              </div>

              <div className="instructionsBox">
                <span className="label">Instructions générées</span>
                <pre>{profile.instructions}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}