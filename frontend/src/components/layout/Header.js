
const Header = () => {
    return (
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">

            <div>
                <h2 className="font-semibold text-slate-800">
                    Workspace
                </h2>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">
                    Welcome
                </span>

                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-700">
                    U
                </div>
            </div>

        </header>
    );
};

export default Header;
