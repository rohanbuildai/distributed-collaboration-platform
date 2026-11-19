
const Dashboard = () => {
    return (
        <section>

            {/* Page Heading */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">
                    Dashboard
                </h1>

                <p className="text-sm text-slate-500 mt-2">
                    Manage your documents and workspace.
                </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <div className="bg-white border rounded-xl p-6">
                    <p className="text-sm text-slate-500">
                        My Documents
                    </p>

                    <h2 className="text-3xl font-bold mt-3">
                        0
                    </h2>
                </div>

                <div className="bg-white border rounded-xl p-6">
                    <p className="text-sm text-slate-500">
                        Shared Documents
                    </p>

                    <h2 className="text-3xl font-bold mt-3">
                        0
                    </h2>
                </div>

                <div className="bg-white border rounded-xl p-6">
                    <p className="text-sm text-slate-500">
                        Active Collaborations
                    </p>

                    <h2 className="text-3xl font-bold mt-3">
                        0
                    </h2>
                </div>

            </div>

            {/* Recent Documents */}
            <div className="mt-8 bg-white border rounded-xl p-8">
                <h2 className="text-lg font-semibold">
                    Recent Documents
                </h2>

                <p className="text-sm text-slate-500 mt-3">
                    Your recent documents will appear here.
                </p>
            </div>

        </section>
    );
};

export default Dashboard;
