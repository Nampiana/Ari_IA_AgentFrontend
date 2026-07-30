import React from "react";
import { buildRecordUrl } from "../../utils/buildPathAudio";

const UnifiedCard = ({
  icon = "bi-telephone-fill",
  accentVar,
  title,
  subtitle,
  description,
  metaItems,
  badges,
  audioPath,
  onDelete,
}) => {
  const recordUrl = buildRecordUrl(audioPath);

  return (
    <div className="calCard" style={{ "--card-accent": accentVar }}>
      <div className="calCard__top">
        <div className="calCard__avatar">
          <i className={`bi ${icon}`} />
        </div>

        <div className="calCard__left">
          <div className="calCard__badges">{badges}</div>
          <div className="calCard__title">{title}</div>
          {subtitle && <div className="calCard__subtitle">{subtitle}</div>}
          {description && <div className="calCard__desc">{description}</div>}
          {metaItems?.length > 0 && (
            <div className="calCard__meta">
              {metaItems.map((m, i) => (
                <span key={i} className="calCard__metaItem">
                  <i className={`bi ${m.icon}`} />
                  {m.text}
                </span>
              ))}
            </div>
          )}
        </div>

        {onDelete && (
          <div className="calCard__right">
            <button
              type="button"
              className="calCard__deleteBtn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Supprimer"
            >
              <i className="bi bi-trash3" />
            </button>
          </div>
        )}
      </div>

      <div className="calCard__audio" onClick={(e) => e.stopPropagation()}>
        {recordUrl ? (
          <audio controls className="w-100" style={{ height: 34 }}>
            <source src={recordUrl} />
            Votre navigateur ne supporte pas l'audio.
          </audio>
        ) : (
          <span className="calCard__noAudio">
            <i className="bi bi-volume-mute" />
            Pas d'enregistrement
          </span>
        )}
      </div>
    </div>
  );
};

export default UnifiedCard;
