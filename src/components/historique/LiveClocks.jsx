import { useEffect, useState } from "react";

const CLOCK_ZONES = [
  { tz: "Indian/Antananarivo", flag: "🇲🇬", label: "Madagascar" },
  { tz: "Europe/Paris", flag: "🇫🇷", label: "France" },
];

export default function LiveClocks() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000); // ← rafraîchi chaque seconde
    return () => clearInterval(id);
  }, []);

  return (
    <div className="scd-live-clocks">
      {CLOCK_ZONES.map(({ tz, flag, label }) => (
        <span key={tz} className="scd-live-clock" title={label}>
          <span className="scd-live-clock-flag">{flag}</span>
          {now.toLocaleTimeString("fr-FR", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      ))}
    </div>
  );
}
