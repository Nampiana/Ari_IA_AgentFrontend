import React, { useState } from "react";
import useAgent from "../../hooks/useAgent";
import HeaderBar from "../../components/agents/HeaderBar";
import "../../assets/css/AgentProfileTesterPage.css";

export default function AgentProfileTesterPage({ showToast }) {
  const { getAgentProfileByNumber } = useAgent();
  const [error, setError] = useState(null);
  const [calledNumber, setCalledNumber] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!calledNumber.trim()) {
      showToast("Veuillez entrer un numéro", "danger");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await getAgentProfileByNumber(calledNumber);
      const data = res?.data?.data || null;

      if (!data) {
        setProfile(null);
        setError("Aucun profil trouvé pour ce numéro");
        showToast("Aucun profil trouvé", "warning");
        return;
      }

      setProfile(data);
      showToast("Profil récupéré avec succès", "success");
    } catch (error) {
      console.error("Erreur récupération profil :", error);

      setProfile(null);
      setError("Erreur lors de la récupération du profil");
      showToast(error?.response?.data?.message || "Erreur serveur", "danger");
    } finally {
      setLoading(false);
    }
  };

  const ficheColumns =
    profile?.fiche?.infoFiche && profile.fiche.infoFiche.length > 0
      ? Object.keys(profile.fiche.infoFiche[0])
      : [];

  return (
    <div className="testerPage">
      <HeaderBar />

      <div className="testerContainer">
        <div className="testerCard">
          <h1>Tester le profil retourné par l’API</h1>
          <p>Entrez un numéro pour tester la route</p>

          <div className="testerInputRow">
            <input
              type="text"
              placeholder="Ex: 33568080149"
              value={calledNumber}
              onChange={(e) => setCalledNumber(e.target.value)}
            />
            <button
              type="button"
              className="btnPrimary"
              onClick={handleTest}
              disabled={loading}
            >
              {loading ? "Test en cours..." : "Tester"}
            </button>
          </div>

          {loading && <div className="loadingBox">Chargement du profil...</div>}

          {error && !loading && (
            <div className="errorBox">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          {profile && !loading && (
            <div className="profileResultCard">
              <div className="profileTop">
                <div>
                  <h2>{profile.nomAgent}</h2>
                  <p>{profile.companyName}</p>
                </div>

                <div className="profileBadges">
                  <span className="badge success">
                    {profile.active === 1 ? "Actif" : "Inactif"}
                  </span>
                  {profile.isDefault === 1 && (
                    <span className="badge default">Par défaut</span>
                  )}
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
                  <span className="label">Campagne</span>
                  <div>{profile.nomCompagne || "Non définie"}</div>
                </div>
              </div>

              <div className="instructionsBox">
                <span className="label">Fiche liée</span>

                {profile.fiche ? (
                  <>
                    <div className="ficheTitleRow">
                      <strong>Nom de la fiche :</strong>
                      <span>{profile.fiche.nomFiche}</span>
                    </div>

                    {profile.fiche.infoFiche?.length > 0 ? (
                      <div className="ficheTableWrapper">
                        <table className="ficheTable">
                          <thead>
                            <tr>
                              {ficheColumns.map((col) => (
                                <th key={col}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {profile.fiche.infoFiche.map((row, i) => (
                              <tr key={i}>
                                {ficheColumns.map((col) => (
                                  <td key={col}>{row[col] || ""}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="emptyFicheText">
                        Aucune information dans cette fiche
                      </div>
                    )}
                  </>
                ) : (
                  <div>Aucune fiche liée</div>
                )}
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