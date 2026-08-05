// ─── Constantes & helpers partagés — module Calendrier ─────────────────────
// Toutes les couleurs viennent des tokens --cal-* définis dans index.css.
// Un seul jeu de définitions ici, réutilisé par CalendrierPage, UnifiedCard,
// Badges et DayDetailModal : on ne code jamais une couleur en dur dans le JS.

export const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Sources d'appel
export const SOURCE_DEFS = {
  1: {
    label: "Auto",
    badgeClass: "calBadge--auto",
    legendClass: "calSourceLegend--auto",
    icon: "bi-robot",
  },
  2: {
    label: "Manuel",
    badgeClass: "calBadge--manuel",
    legendClass: "calSourceLegend--manuel",
    icon: "bi-person-fill",
  },
  3: {
    label: "CRM",
    badgeClass: "calBadge--crm",
    legendClass: "calSourceLegend--crm",
    icon: "bi-person-badge-fill",
  },
};

export const getSourceDef = (source) => SOURCE_DEFS[source] || SOURCE_DEFS[1];

// Statuts de qualification d'appel — 6 teintes (--cal-rappel, --cal-ni, ...)
// réutilisées partout : puces de filtre, points du calendrier, badges de fiche.
export const REASON_DEFS = {
  RAPPEL: {
    label: "Rappel",
    badgeClass: "calBadge--rappel",
    chipClass: "calChip--rappel",
    dotVar: "var(--cal-rappel)",
  },
  CALLBACK: {
    label: "Rappel",
    badgeClass: "calBadge--rappel",
    chipClass: "calChip--rappel",
    dotVar: "var(--cal-rappel)",
  },
  NI: {
    label: "Non intéressé",
    badgeClass: "calBadge--ni",
    chipClass: "calChip--ni",
    dotVar: "var(--cal-ni)",
  },
  OCCUPE: {
    label: "Occupé",
    badgeClass: "calBadge--occupe",
    chipClass: "calChip--occupe",
    dotVar: "var(--cal-occupe)",
  },
  REPONDEUR: {
    label: "Répondeur",
    badgeClass: "calBadge--repondeur",
    chipClass: "calChip--repondeur",
    dotVar: "var(--cal-repondeur)",
  },
  SALE: {
    label: "Vente / RDV",
    badgeClass: "calBadge--sale",
    chipClass: "calChip--sale",
    dotVar: "var(--cal-sale)",
  },
  SVI: {
    label: "SVI",
    badgeClass: "calBadge--svi",
    chipClass: "calChip--svi",
    dotVar: "var(--cal-svi)",
  },
};

export const getReasonDef = (key) =>
  REASON_DEFS[key] || {
    label: key || "—",
    badgeClass: "calBadge--neutral",
    chipClass: "calChip--all",
    dotVar: "var(--cal-ink-soft)",
  };

// Statut numérique historique → clé de raison
export const STATUS_TO_REASON = {
  1: "NI",
  2: "SALE",
  3: "RAPPEL",
  4: "OCCUPE",
  5: "REPONDEUR",
  6: "SVI",
  CALLBACK: "RAPPEL",
};

// Codes couleur CRM — alignés sur les mêmes teintes sémantiques
export const CRM_STATUS_DEFS = {
  1: {
    label: "Confirmé",
    badgeClass: "calBadge--sale",
    dotVar: "var(--cal-sale)",
    icon: "bi-check-circle-fill",
  },
  2: {
    label: "Non confirmé",
    badgeClass: "calBadge--gray",
    dotVar: "var(--cal-gray)",
    icon: "bi-x-circle-fill",
  },
  3: {
    label: "À relancer",
    badgeClass: "calBadge--repondeur",
    dotVar: "var(--cal-repondeur)",
    icon: "bi-arrow-repeat",
  },
};

export const SCHEDULED_STATUS = {
  pending: { label: "En attente", badgeClass: "calBadge--pending" },
  running: { label: "En cours", badgeClass: "calBadge--running" },
  done: { label: "Terminé", badgeClass: "calBadge--done" },
  failed: { label: "Échec", badgeClass: "calBadge--failed" },
};

export const FILTER_CHIPS = [
  { key: "ALL", label: "Tous", chipClass: "calChip--all" },
  { key: "RAPPEL", label: "Rappel", chipClass: "calChip--rappel" },
  { key: "NI", label: "Non intéressé", chipClass: "calChip--ni" },
  { key: "OCCUPE", label: "Occupé", chipClass: "calChip--occupe" },
  { key: "REPONDEUR", label: "Répondeur", chipClass: "calChip--repondeur" },
  { key: "SVI", label: "SVI", chipClass: "calChip--svi" },
  { key: "SALE", label: "Vente / RDV", chipClass: "calChip--sale" },
];

// Les 3 catégories affichées dans la fiche-jour (DayDetailModal), dans l'ordre
// où elles apparaissent en onglets. La couleur pilote l'accent de l'onglet.
export const DAY_SECTIONS = [
  {
    key: "historiques",
    label: "Appels",
    icon: "bi-telephone-fill",
    accentVar: "var(--cal-repondeur)",
    accentSoftVar: "var(--cal-repondeur-soft)",
    accentBorderVar: "var(--cal-repondeur-border)",
  },
  {
    key: "crmLeads",
    label: "Leads CRM",
    icon: "bi-person-badge-fill",
    accentVar: "var(--cal-source-crm)",
    accentSoftVar: "var(--cal-source-crm-soft)",
    accentBorderVar: "var(--cal-crm-border)",
  },
  {
    key: "scheduled",
    label: "Rappels",
    icon: "bi-telephone-outbound-fill",
    accentVar: "var(--cal-rappel)",
    accentSoftVar: "var(--cal-rappel-soft)",
    accentBorderVar: "var(--cal-rappel-border)",
  },
];

export function mondayFirstIndex(date) {
  return (date.getDay() + 6) % 7;
}

export function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDuration(billsec) {
  if (!billsec && billsec !== 0) return "—";
  const min = Math.floor(billsec / 60);
  const sec = billsec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}min ${sec}s`;
}
