
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
        <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
            {/* Workspace information */}
            <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-slate-800">
                    Workspace
                </h2>

                <p className="hidden text-xs text-slate-500 sm:block">
                    Your collaborative workspace
                </p>
            </div>

            {/* User actions */}
            <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700"
                        aria-label="User profile"
                    >
                        U
                    </div>

                    <span className="hidden text-sm font-medium text-slate-700 sm:block">
                        Welcome
                    </span>
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
            </div>

            {/* Logout error */}
            {error && (
                <div
                    role="alert"
                    className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                    {error}
                </div>
            )}
        </header>
    );
};

export default Header;
