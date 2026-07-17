import React from "react";

export default function CompagneCard({
  compagne,
  onEdit,
  onDelete,
  lancerCampagne,
  onQualifications,
  onToggleBackgroundNoise,
  onEmailConfig,
}) {
  const isInbound = compagne.callType === "inbound";
  const numerosSecondaires = Array.isArray(compagne.numeros)
    ? compagne.numeros.filter(Boolean)
    : [];

  return (
    <div className="compagneCard">
      <div className="compagneCardTop">
        <div>
          <h3 className="compagneName">{compagne.nomCompagne}</h3>
          <div className="compagneNumero">{compagne.numero}</div>

          <div className="compagneBadges">
            <span
              className={`badge ${compagne.active === 1 ? "success" : "danger"}`}
            >
              {compagne.active === 1 ? "Actif" : "Inactif"}
            </span>

            <span
              className={`badge ${compagne.backgroundNoise ? "success" : "danger"}`}
            >
              <i
                className={`bi ${
                  compagne.backgroundNoise
                    ? "bi-volume-up-fill"
                    : "bi-volume-mute-fill"
                }`}
              />{" "}
              {compagne.backgroundNoise ? "Fond actif" : "Fond off"}
            </span>

            <span
              className={`badge ${isInbound ? "badgeInbound" : "badgeOutbound"}`}
            >
              <i
                className={`bi ${
                  isInbound
                    ? "bi-telephone-inbound-fill"
                    : "bi-telephone-outbound-fill"
                }`}
              />{" "}
              {isInbound ? "Entrant" : "Sortant"}
            </span>

            {numerosSecondaires.length > 0 && (
              <span
                className={`badge ${
                  isInbound
                    ? "badgeInboundNumbers"
                    : "badgeNumerosRotation"
                }`}
              >
                <i
                  className={`bi ${
                    isInbound ? "bi-telephone-inbound-fill" : "bi-arrow-repeat"
                  }`}
                />{" "}

                {isInbound
                  ? `${numerosSecondaires.length} numéro${
                      numerosSecondaires.length > 1 ? "s" : ""
                    } entrant${
                      numerosSecondaires.length > 1 ? "s" : ""
                    } supplémentaire${
                      numerosSecondaires.length > 1 ? "s" : ""
                    }`
                  : `${numerosSecondaires.length} numéro${
                      numerosSecondaires.length > 1 ? "s" : ""
                    } en rotation`}
              </span>
            )}

            <span
              className={`badge ${
                compagne.maxConcurrentCalls > 1
                  ? "badgeConcurrent"
                  : "badgeSeq"
              }`}
            >
              <i
                className="bi bi-telephone-fill"
                style={{ color: "#10b981" }}
              />
              <span style={{ color: "#10b981" }}>
                ×{compagne.maxConcurrentCalls ?? 1}
              </span>
            </span>
          </div>
        </div>

        <div className="compagneStatusWrap">
          <div className="cardActionHeader">
            {!isInbound && (
              <button
                type="button"
                className={`btnAction ${
                  compagne.isRunning === 1 ? "btnStop" : "btnStart"
                }`}
                onClick={() => lancerCampagne(compagne)}
              >
                <i
                  className={`bi ${
                    compagne.isRunning === 1
                      ? "bi-stop-fill"
                      : "bi-play-fill"
                  }`}
                />
                {compagne.isRunning === 1 ? "Arrêter" : "Lancer"}
              </button>
            )}

            <button
              type="button"
              className="btnIconAction btnIconEdit"
              onClick={() => onEdit(compagne)}
              title="Modifier"
              aria-label="Modifier"
            >
              <i className="bi bi-pencil-square" />
            </button>

            <button
              type="button"
              className="btnIconAction btnIconDelete"
              onClick={() => onDelete(compagne)}
              title="Supprimer"
              aria-label="Supprimer"
            >
              <i className="bi bi-trash3" />
            </button>
          </div>

          <div className="cardActionTools">
            <button
              type="button"
              className="btnCardAction btnQualification"
              onClick={() => onQualifications(compagne)}
            >
              <i className="bi bi-tags" />
              <span>Qualifications</span>
            </button>

            <button
              type="button"
              className="btnCardAction"
              onClick={() => onEmailConfig(compagne)}
            >
              <i className="bi bi-envelope-fill" />
              <span>Email</span>
            </button>

            <button
              type="button"
              className={`btnCardAction ${
                compagne.backgroundNoise ? "btnNoiseOn" : "btnNoiseOff"
              }`}
              onClick={() => onToggleBackgroundNoise(compagne)}
            >
              <i
                className={`bi ${
                  compagne.backgroundNoise
                    ? "bi-volume-up-fill"
                    : "bi-volume-mute-fill"
                }`}
              />
              <span>{compagne.backgroundNoise ? "Fond ON" : "Fond OFF"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="compagneMetaGrid">
        <div>
          <span className="label">Numéro principal</span>
          <div>{compagne.numero || "-"}</div>
        </div>

        {numerosSecondaires.length > 0 && (
          <div>
            <span className="label">
              {isInbound
                ? "Autres numéros entrants"
                : "Numéros sortants en rotation"}
            </span>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {numerosSecondaires.map((numero, index) => (
                <span
                  key={`${numero}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.82rem",
                    color: "var(--gray-secondaire)",
                  }}
                >
                  <i
                    className={`bi ${
                      isInbound ? "bi-telephone-inbound" : "bi-arrow-repeat"
                    }`}
                  />
                  {numero}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="label">Type d'appel</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i
              className={`bi ${
                isInbound
                  ? "bi-telephone-inbound-fill"
                  : "bi-telephone-outbound-fill"
              }`}
              style={{ color: isInbound ? "#6366f1" : "#f59e0b" }}
            />
            {isInbound ? "Entrant" : "Sortant"}
          </div>
        </div>

        {!isInbound && (
          <div>
            <span className="label">Fiches</span>
            <div>
              {compagne.fiches?.length
                ? compagne.fiches.map((f) => f.nomFiche).join(", ")
                : "Non définies"}
            </div>
          </div>
        )}

        <div>
          <span className="label">Agent IA</span>
          <div>{compagne.id_ia?.nomAgent || "Non défini"}</div>
        </div>

        {!isInbound && (
          <div>
            <span className="label">Timeout</span>
            <div>{compagne.dialTimeout ?? 30}s</div>
          </div>
        )}

        {!isInbound && (
          <>
            <div>
              <span className="label">Appels disponibles</span>
              <div>{compagne.callStats?.appelsDisponibles ?? 0}</div>
            </div>

            <div>
              <span className="label">Fiches disponibles</span>
              {compagne.callStats?.parListe?.length > 0 ? (
                <div className="formHint">
                  {compagne.callStats.parListe.map((liste) => (
                    <div key={liste.listId}>
                      {liste.nomFiche} : {liste.disponible} disponible(s) sur{" "}
                      {liste.total}
                    </div>
                  ))}
                </div>
              ) : (
                <div>0</div>
              )}
            </div>
          </>
        )}

        <div>
          <span className="label">Appels simultanés</span>
          <div className="concurrentDisplay">
            <i className="bi bi-telephone-fill concurrentDot" />
            <span className="concurrentCount">
              {compagne.maxConcurrentCalls ?? 1}
            </span>
          </div>
        </div>

        <div>
          <span className="label">Jours autorisés</span>
          <div>
            {compagne.allowedDays?.length
              ? compagne.allowedDays
                  .map(
                    (jour) =>
                      ({
                        0: "Dim",
                        1: "Lun",
                        2: "Mar",
                        3: "Mer",
                        4: "Jeu",
                        5: "Ven",
                        6: "Sam",
                      })[jour],
                  )
                  .join(", ")
              : "Lun - Ven"}
          </div>
        </div>

        <div>
          <span className="label">Horaires</span>
          <div>
            {compagne.startHour || "08:00"} - {compagne.endHour || "21:00"}
          </div>
        </div>

        <div>
          <span className="label">Fuseau</span>
          <div>{compagne.timeZone || "Europe/Paris"}</div>
        </div>
      </div>

      <div className="compagneScriptBlock">
        <span className="label">Script final</span>
        <p>{compagne.scriptFinal || compagne.script}</p>
      </div>
    </div>
  );
}
