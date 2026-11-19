
"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
} from "../authService";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            try {
                const response = await getCurrentUser();

                if (isMounted) {
                    setUser({ id: response.userId });
                    setAuthError(null);
                }
            } catch (error) {
                if (isMounted) {
                    setUser(null);
                    setAuthError(error);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        initializeAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    const register = useCallback(async (userData) => {
        return await registerUser(userData);
    }, []);

    const login = useCallback(async (credentials) => {
        await loginUser(credentials);

        const response = await getCurrentUser();

        const currentUser = {
            id: response.userId,
        };

        setUser(currentUser);
        setAuthError(null);

        return currentUser;
    }, []);

    const logout = useCallback(async () => {
        await logoutUser();

        setUser(null);
        setAuthError(null);
    }, []);

    const value = useMemo(() => ({
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        authError,
        register,
        login,
        logout,
    }), [
        user,
        isLoading,
        authError,
        register,
        login,
        logout,
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used within an AuthProvider"
        );
    }

    return context;
};

export {
    AuthProvider,
    useAuth,
};
