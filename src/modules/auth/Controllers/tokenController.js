const tokenService = require("../Services/tokenService") ;

const refreshAccessToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        const tokens = await tokenService.refreshAccessToken(
            refreshToken
        );

        return res.status(200).json({
            success: true,
            data: {
                tokens
            }
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        await tokenService.logout(refreshToken);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    refreshAccessToken ,
    logout
}