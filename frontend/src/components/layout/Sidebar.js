
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: "▦",
    },
    {
        label: "My Documents",
        href: "/dashboard/documents",
        icon: "▤",
    },
    {
        label: "Shared With Me",
        href: "/dashboard/shared",
        icon: "⇄",
    },
];

const Sidebar = () => {
    const pathname = usePathname();

    return (
        <aside className="flex min-h-screen w-full flex-col bg-slate-950 p-5 text-white md:w-64 md:shrink-0 md:p-6">
            {/* Brand */}
            <div className="mb-8 md:mb-10">
                <Link href="/dashboard">
                    <h1 className="text-2xl font-bold tracking-tight">
                        CollabSpace
                    </h1>
                </Link>

                <p className="mt-2 text-xs text-slate-400">
                    Collaborative Workspace
                </p>
            </div>

            {/* Navigation */}
            <nav
                aria-label="Main navigation"
                className="flex flex-col gap-2"
            >
                {navigationItems.map((item) => {
                    const isActive =
                        item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname === item.href ||
                              pathname.startsWith(`${item.href}/`);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                        >
                            <span
                                aria-hidden="true"
                                className="w-5 text-center text-base"
                            >
                                {item.icon}
                            </span>

                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="mt-auto border-t border-slate-800 pt-5">
                <p className="text-xs text-slate-500">
                    Collaborative Platform V1
                </p>
            </div>
        </aside>
    );
};

export default Sidebar;
