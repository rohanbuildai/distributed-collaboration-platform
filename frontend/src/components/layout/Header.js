
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";

const Header = () => {
    const { logout } = useAuth();
    const router = useRouter();

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [error, setError] = useState("");

    const handleLogout = async () => {
        try {
            setError("");
            setIsLoggingOut(true);

            await logout();

            router.replace("/login");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to logout. Please try again."
            );
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <header className="min-h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
            <div>
                <h2 className="font-semibold text-slate-800">
                    Workspace
                </h2>
            </div>

            <div className="flex items-center gap-4">
                {error && (
                    <span className="text-sm text-red-600">
                        {error}
                    </span>
                )}

                <span className="text-sm text-slate-600">
                    Welcome
                </span>

                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-700">
                    U
                </div>

                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
            </div>
        </header>
    );
};

export default Header;
