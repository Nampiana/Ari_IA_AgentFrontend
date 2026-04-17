import React, { createContext, useState, useEffect } from "react";
import AuthServices from "../services/AuthServices";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLogged, setIsLogged] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    const publicRoutes = ["/login", "/forgot-password"];
    const isResetPasswordRoute = location.pathname.startsWith("/reset-password/");
    const isPublicRoute =
        publicRoutes.includes(location.pathname) || isResetPasswordRoute;

    const login = async (credentials) => {
        setIsLoading(true);

        try {
            const res = await AuthServices.login(credentials);
            const userData = res.data?.data?.user;
            const token = res.data?.token;

            if (!userData || !token) {
                throw new Error("Réponse de connexion invalide.");
            }

            if (userData.active === false) {
                setAlertMessage({
                    type: "danger",
                    text: "Votre compte est désactivé. Veuillez contacter l'administrateur.",
                });

                toast.error(
                    "Votre compte est désactivé. Veuillez contacter l'administrateur.",
                    {
                        position: "top-right",
                        theme: "colored",
                        className: "toast-message",
                    }
                );
                return false;
            }

            localStorage.setItem("access_token", token);
            localStorage.setItem("user", JSON.stringify(userData));

            setUser(userData);
            setIsLogged(true);

            toast.success("Connexion réussie.", {
                position: "top-right",
                theme: "colored",
                className: "toast-message",
            });

            navigate("/");
            return true;
        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Erreur de connexion !";

            setAlertMessage({
                type: "danger",
                text: message,
            });

            toast.error(message, {
                position: "top-right",
                theme: "colored",
                className: "toast-message",
            });

            setIsLogged(false);
            setUser(null);
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");

            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await AuthServices.logout();
        } catch (error) {
            console.error("Erreur lors de la déconnexion :", error);
        } finally {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            setIsLogged(false);
            setUser(null);

            toast.info("Déconnexion effectuée.", {
                position: "top-right",
                theme: "colored",
                className: "toast-message",
            });

            navigate("/login");
        }
    };

    useEffect(() => {
        if (alertMessage) {
            const timer = setTimeout(() => setAlertMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [alertMessage]);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        const localUser = localStorage.getItem("user");

        if (!token) {
            setIsLogged(false);
            setUser(null);

            if (!isPublicRoute) {
                navigate("/login");
            }
            return;
        }

        if (localUser) {
            try {
                setUser(JSON.parse(localUser));
                setIsLogged(true);
            } catch {
                localStorage.removeItem("user");
            }
        }

        AuthServices.checkToken()
            .then((res) => {
                const userData = res.data?.data?.user;

                if (!userData) {
                    throw new Error("Utilisateur introuvable");
                }

                if (userData.active === false) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("user");
                    setIsLogged(false);
                    setUser(null);

                    toast.error(
                        "Votre compte est désactivé. Veuillez contacter l'administrateur.",
                        {
                            position: "top-right",
                            theme: "colored",
                            className: "toast-message",
                        }
                    );

                    navigate("/login");
                    return;
                }

                setUser(userData);
                setIsLogged(true);
                localStorage.setItem("user", JSON.stringify(userData));

                if (
                    location.pathname === "/login" ||
                    location.pathname === "/forgot-password" ||
                    isResetPasswordRoute
                ) {
                    navigate("/");
                }
            })
            .catch(() => {
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                setIsLogged(false);
                setUser(null);

                if (!isPublicRoute) {
                    navigate("/login");
                }
            });
    }, [navigate, location.pathname]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLogged,
                isLoading,
                login,
                logout,
                setIsLoading,
                alertMessage,
                setAlertMessage,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};