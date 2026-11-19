
import "./global.css";

import { AuthProvider } from "@/features/auth/context/AuthContext";

const RootLayout = ({ children }) => {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
};

export default RootLayout;
