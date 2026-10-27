
const tokenService = require("../Services/tokenService");

const {
    setAuthCookies,
    clearAuthCookies
} = require("../../../utils/tokens/authCookieUtils");

const refreshAccessToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        const tokens = await tokenService.refreshAccessToken(
            refreshToken
        );

        setAuthCookies(res, tokens);

        return res.status(200).json({
            success: true,
            message: "Session refreshed successfully"
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        await tokenService.logout(refreshToken);

        clearAuthCookies(res);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    refreshAccessToken,
    logout
};
