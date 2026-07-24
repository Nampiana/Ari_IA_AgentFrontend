export const getStatusLabel = (status) => {
  const value = Number(status);
  if (value === 2) return "RÉUSSI";
  if (value === 3) return "RAPPEL";
  if (value === 4) return "OCCUPÉ";
  if (value === 1) return "PAS_INTÉRESSÉ";
  if (value === 5) return "RÉPONDEUR";
  if (value === 6) return "SVI";
  if (value === 7) return "AMD_RÉPONDEUR";
  if (value === 8) return "HORS_CIBLE";
  return "INCONNU";
};

export const getStatusClass = (status) => {
  const value = Number(status);
  if (value === 2) return "RÉUSSI";
  if (value === 3) return "RAPPEL";
  if (value === 4) return "OCCUPÉ";
  if (value === 1) return "PAS_INTÉRESSÉ";
  if (value === 5) return "RÉPONDEUR";
  if (value === 6) return "SVI";
  if (value === 7) return "AMD_RÉPONDEUR";
  if (value === 8) return "HORS_CIBLE";
  return "default";
};