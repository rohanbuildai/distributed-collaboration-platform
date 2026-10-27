
const getCookieOptions = ({ path, maxAge }) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path,
    maxAge
});

const setAuthCookies = (res, { accessToken, refreshToken }) => {
    res.cookie(
        "accessToken",
        accessToken,
        getCookieOptions({
            path: "/",
            maxAge: 15 * 60 * 1000
        })
    );

    res.cookie(
        "refreshToken",
        refreshToken,
        getCookieOptions({
            path: "/api/v1/auth",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
    );
};

const clearAuthCookies = (res) => {
    res.clearCookie(
        "accessToken",
        getCookieOptions({ path: "/" })
    );

    res.clearCookie(
        "refreshToken",
        getCookieOptions({ path: "/api/v1/auth" })
    );
};

module.exports = {
    setAuthCookies,
    clearAuthCookies
};
