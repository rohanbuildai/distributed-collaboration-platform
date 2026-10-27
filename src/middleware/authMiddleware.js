
const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
    try {
        let token = req.cookies?.accessToken;

        if (!token) {
            const authorization = req.headers.authorization;

            if (!authorization) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            const parts = authorization.split(" ");

            if (
                parts.length !== 2 ||
                parts[0] !== "Bearer" ||
                !parts[1]
            ) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid authentication format"
                });
            }

            token = parts[1];
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET
        );

        if (decoded.type !== "access" || !decoded.sub) {
            return res.status(401).json({
                success: false,
                message: "Invalid access token"
            });
        }

        req.user = {
            id: decoded.sub
        };

        return next();
    } catch (error) {
        console.error("Access token verification failed:", {
            name: error.name,
            message: error.message
        });

        return res.status(401).json({
            success: false,
            message: "Invalid or expired access token"
        });
    }
};

module.exports = {
    authenticate
};
