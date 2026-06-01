export function buildRecordUrl(pathRecord) {
  if (!pathRecord) return "";
  if (pathRecord.startsWith("http://") || pathRecord.startsWith("https://"))
    return pathRecord;
  const base = (
    process.env.REACT_APP_HOST_API || "http://localhost:4000/api/v1/"
  )
    .replace("/api/v1/", "")
    .replace(/\/$/, "");
  return `${base}/files/${pathRecord}`;
}

export function formatDateTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(date) {
  if (!date) return "";
  const diff = new Date(date) - new Date();
  const abs = Math.abs(diff);
  const past = diff < 0;
  if (abs < 60_000)
    return past ? "il y a quelques secondes" : "dans quelques secondes";
  if (abs < 3_600_000) {
    const m = Math.round(abs / 60_000);
    return past ? `il y a ${m} min` : `dans ${m} min`;
  }
  if (abs < 86_400_000) {
    const h = Math.round(abs / 3_600_000);
    return past ? `il y a ${h}h` : `dans ${h}h`;
  }
  const d = Math.round(abs / 86_400_000);
  return past
    ? `il y a ${d} jour${d > 1 ? "s" : ""}`
    : `dans ${d} jour${d > 1 ? "s" : ""}`;
}
