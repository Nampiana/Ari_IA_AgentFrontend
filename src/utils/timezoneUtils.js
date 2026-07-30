// ── Fuseaux horaires disponibles dans l'app ─────────────────────────────────
// Pour ajouter/retirer un pays : modifier uniquement ce tableau.
// Tout le reste (sélecteurs, horloges live, statut planning) suit.
export const TIMEZONES = [
  { value: "Europe/Paris", label: "France — Paris", flag: "🇫🇷" },
  {
    value: "Indian/Antananarivo",
    label: "Madagascar — Antananarivo",
    flag: "🇲🇬",
  },
];

export const getTimezoneMeta = (tz) =>
  TIMEZONES.find((t) => t.value === tz) || {
    value: tz || "Europe/Paris",
    label: tz || "Europe/Paris",
    flag: "🌍",
  };

// Heure "HH:mm" dans un fuseau donné, à partir d'un objet Date
export const getZonedTime = (date, timeZone) =>
  date.toLocaleTimeString("fr-FR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

// Jour de semaine (0 = Dim … 6 = Sam, comme le tableau DAYS des formulaires)
// dans un fuseau donné
export const getZonedWeekday = (date, timeZone) =>
  new Date(date.toLocaleString("en-US", { timeZone })).getDay();

// Décalage UTC affiché (ex : "UTC+1", "UTC+3")
export const getZonedOffsetLabel = (date, timeZone) => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value?.replace("GMT", "UTC") || "";
  } catch {
    return "";
  }
};

// Vrai si "date" (interprétée dans "timeZone") tombe dans un jour autorisé
// ET dans l'une des tranches horaires fournies.
export const isWithinSchedule = (date, timeZone, allowedDays, tranches) => {
  const hhmm = getZonedTime(date, timeZone);
  const zonedDay = getZonedWeekday(date, timeZone);
  const validTranches = (tranches || []).filter(
    (t) => t.startHour && t.endHour,
  );
  return (
    (allowedDays || []).includes(zonedDay) &&
    validTranches.some((t) => hhmm >= t.startHour && hhmm <= t.endHour)
  );
};