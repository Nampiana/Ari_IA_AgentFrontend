export const buildRecordUrl = (pathRecord) => {
    if (!pathRecord) return "";
  
    // URL absolue déjà complète → on la retourne telle quelle
    if (pathRecord.startsWith("http://") || pathRecord.startsWith("https://")) {
      return pathRecord;
    }
  
    // Base URL depuis la variable Vite (ex: http://localhost:4000/api/v1/)
    const base = (import.meta.env.REACT_APP_HOST_API || "http://localhost:4000/api/v1/")
      .replace("/api/v1/", "")
      .replace(/\/$/, "");
      1776865680.184.wav
    return `${base}/files/${pathRecord}`;
  };