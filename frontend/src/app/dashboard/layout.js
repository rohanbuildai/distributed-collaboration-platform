
"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useAuth } from "@/features/auth/context/AuthContext";

const DashboardLayoutContent = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();

    const { user, isLoading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/login");
        }
    }, [isLoading, user, router]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- closing mobile menu on route change is intentional
        setIsMobileMenuOpen(false);
    }, [pathname]);

    if (isLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <p className="text-sm text-slate-500">
                    Checking authentication...
                </p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        aria-label="Close navigation menu"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="absolute inset-0 bg-black/50"
                    />

                    <div className="relative z-10 h-full w-72 max-w-[85vw] shadow-xl">
                        <div className="flex justify-end bg-slate-950 px-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                aria-label="Close navigation menu"
                                className="rounded-lg p-2 text-white hover:bg-slate-800"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="h-[calc(100%-56px)] overflow-y-auto">
                            <Sidebar />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center border-b border-slate-200 bg-white px-4 md:hidden">
                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Open navigation menu"
                        aria-expanded={isMobileMenuOpen}
                        className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100"
                    >
                        <span className="text-2xl">☰</span>
                    </button>

                    <span className="ml-3 font-semibold text-slate-800">
                        CollabSpace
                    </span>
                </div>

                <Header />

                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

const DashboardLayout = ({ children }) => {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <p>Loading dashboard...</p>
                </div>
            }
        >
            <DashboardLayoutContent>
                {children}
            </DashboardLayoutContent>
        </Suspense>
    );
};

export default DashboardLayout;
