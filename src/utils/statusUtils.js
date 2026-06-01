export const getStatusLabel = (status) => {
  const value = Number(status);
  if (value === 2) return "RÉUSSI";
  if (value === 3) return "RAPPEL";
  if (value === 4) return "OCCUPÉ";
  if (value === 1) return "PAS_INTÉRESSÉ";
  if (value === 5) return "RÉPONDEUR";
  return "INCONNU";
};

export const getStatusClass = (status) => {
  const value = Number(status);
  if (value === 2) return "RÉUSSI";
  if (value === 3) return "RAPPEL";
  if (value === 4) return "OCCUPÉ";
  if (value === 1) return "PAS_INTÉRESSÉ";
  if (value === 5) return "RÉPONDEUR";
  return "default";
};