import { useState } from "react";
import AuthServices from "../services/AuthServices";

const useAuth = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearState = () => {
    setMessage("");
    setError("");
  };

  const login = async (credentials) => {
    clearState();
    setLoading(true);

    try {
      const res = await AuthServices.login(credentials);
      setMessage("Connexion réussie.");
      return res.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erreur de connexion.";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (userId, passwordData) => {
    clearState();
    setLoading(true);

    try {
      await AuthServices.updatePassword(userId, passwordData);
      setMessage("Mot de passe mis à jour avec succès !");
    } catch (err) {
      const errorMessage =
        typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : "Erreur lors de la mise à jour.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    clearState();
    setLoading(true);

    try {
      const res = await AuthServices.forgotPassword(email);
      setMessage(
        res.data?.message ||
          "Si un compte existe, un lien de réinitialisation a été envoyé."
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Erreur lors de l’envoi de l’e-mail.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordWithToken = async (token, passwordData) => {
    clearState();
    setLoading(true);

    try {
      const res = await AuthServices.resetPassword(token, passwordData);
      setMessage(
        res.data?.message || "Votre mot de passe a été réinitialisé avec succès."
      );
      return res.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erreur lors de la réinitialisation du mot de passe.";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    message,
    error,
    loading,
    login,
    updatePassword,
    forgotPassword,
    resetPasswordWithToken,
  };
};

export default useAuth;