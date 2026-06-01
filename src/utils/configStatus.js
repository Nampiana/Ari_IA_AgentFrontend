export const REASON_CONFIG = {
  CALLBACK: {
    label: "Rappel",
    color: "reason-callback",
    icon: "bi-telephone-inbound",
  },
  OCCUPE: { label: "Occupé", color: "reason-occupe", icon: "bi-telephone-x" },
  REPONDEUR: {
    label: "Répondeur",
    color: "reason-repondeur",
    icon: "bi-speakerphone",
  },
  NI: {
    label: "Pas intéressé",
    color: "reason-ni",
    icon: "bi-hand-thumbs-down",
  },
};

export const STATUS_CONFIG = {
  pending: {
    label: "En attente",
    color: "status-pending",
    icon: "bi-hourglass-split",
  },
  running: {
    label: "En cours",
    color: "status-running",
    icon: "bi-arrow-repeat",
  },
  done: { label: "Terminé", color: "status-done", icon: "bi-check-circle" },
  failed: { label: "Échec", color: "status-failed", icon: "bi-x-circle" },
};

export const RESULT_CONFIG = {
  CALLBACK: { label: "Rappel", color: "reason-callback" },
  OCCUPE: { label: "Occupé", color: "reason-occupe" },
  REPONDEUR: { label: "Répondeur", color: "reason-repondeur" },
  NI: { label: "Pas intéressé", color: "reason-ni" },
  SALE: { label: "Vente / RDV", color: "reason-sale" },
};
