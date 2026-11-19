
import Link from "next/link";

const Sidebar = () => {
    return (
        <aside className="w-64 min-h-screen bg-slate-950 text-white flex flex-col p-6">

            {/* Brand */}
            <div className="mb-10">
                <h1 className="text-2xl font-bold">
                    CollabSpace
                </h1>

                <p className="text-xs text-slate-400 mt-2">
                    Collaborative Workspace
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2">

                <Link
                    href="/dashboard"
                    className="px-4 py-3 rounded-lg bg-slate-800 text-sm"
                >
                    Dashboard
                </Link>

                <Link
                    href="/dashboard/documents"
                    className="px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 text-sm"
                >
                    My Documents
                </Link>

                <Link
                    href="/dashboard/shared"
                    className="px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 text-sm"
                >
                    Shared With Me
                </Link>

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
