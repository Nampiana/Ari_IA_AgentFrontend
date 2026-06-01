import { useState, useRef, useEffect } from "react";
import { getStatusClass, getStatusLabel } from "../../utils/statusUtils.js";
import "../../assets/css/StatusDropdown.css";

const STATUSES = [
  { value: "2", key: "RÉUSSI", icon: "bi-check-circle", label: "Réussi" },
  { value: "3", key: "RAPPEL", icon: "bi-telephone-inbound", label: "Rappel" },
  { value: "4", key: "OCCUPÉ", icon: "bi-telephone-x", label: "Occupé" },
  { value: "5", key: "RÉPONDEUR", icon: "bi-mic", label: "Répondeur" },
  {
    value: "1",
    key: "PAS_INT",
    icon: "bi-hand-thumbs-down",
    label: "Pas intéressé",
  },
];

export default function StatusDropdown({ itemId, status, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="status-dropdown-wrap" ref={ref}>
      <span
        className={`historiqueBadge ${getStatusClass(status)} clickable ${open ? "open" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {getStatusLabel(status)}
        <i className="bi bi-chevron-down ms-1" style={{ fontSize: "10px" }} />
      </span>

      {open && (
        <div className="status-dropdown">
          {STATUSES.map((s) => (
            <div
              key={s.value}
              className={`status-option ${s.key} ${status === s.value ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(itemId, s.value);
                setOpen(false);
              }}
            >
              <i className={`bi ${s.icon}`} />
              {s.label}
              {status === s.value && <i className="bi bi-check ms-auto" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
