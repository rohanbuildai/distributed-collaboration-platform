
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const DashboardLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex bg-slate-50">

            <Sidebar />

            <div className="flex-1 min-w-0">

                <Header />

                <main className="p-8">
                    {children}
                </main>

            </div>

        </div>
    );
};

export default DashboardLayout;
