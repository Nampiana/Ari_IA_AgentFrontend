import React from "react";
import { getSourceDef, getReasonDef } from "../../utils/calendrierConstants.js";

export const SourceBadge = ({ source }) => {
  const def = getSourceDef(source);
  return (
    <span className={`calBadge ${def.badgeClass}`}>
      <i className={`bi ${def.icon}`} />
      {def.label}
    </span>
  );
};

export const ReasonBadge = ({ reasonKey }) => {
  const def = getReasonDef(reasonKey);
  return <span className={`calBadge ${def.badgeClass}`}>{def.label}</span>;
};
