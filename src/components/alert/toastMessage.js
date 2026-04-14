import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import "../../assets/css/alert/alert.css";

const ToastMessage = ({ type, message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const styleConfig = {
    success: {
      bgColor: "bg-green-500",
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Succès",
    },
    danger: {
      bgColor: "bg-red-500",
      icon: <XCircle className="w-5 h-5" />,
      title: "Erreur",
    },
    warning: {
      bgColor: "bg-yellow-500",
      icon: <AlertTriangle className="w-5 h-5" />,
      title: "Attention",
    },
    info: {
      bgColor: "bg-blue-500",
      icon: <Info className="w-5 h-5" />,
      title: "Information",
    },
  }[type];

  return (
    <div className={`toast-container-v7`}>
      <div className={`toast-box-v7 ${type}`} onClick={onClose} role="alert">
        <div className={`toast-type-bar ${type}`}></div>
        <div className="toast-content-wrapper">
          <div className="toast-icon-message">
            <div className={`toast-icon-v7 ${type}`}>{styleConfig.icon}</div>

            <div>
              <strong className="toast-title-v7">{styleConfig.title}</strong>
              <p className="toast-message-text">{message}</p>
            </div>
          </div>
          <button className="toast-close-btn-v7" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

ToastMessage.propTypes = {
  type: PropTypes.oneOf(["success", "danger", "warning", "info"]).isRequired,
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ToastMessage;
