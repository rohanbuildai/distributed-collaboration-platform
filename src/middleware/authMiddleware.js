const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
    try {
        const {authorization} = req.headers;

        if (!authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const [scheme, token] = authorization.split(" ");

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication format"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET
        );

        if (decoded.type !== "access") {
            return res.status(401).json({
                success: false,
                message: "Invalid access token"
            });
        }

        req.user = {
            id: decoded.sub
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired access token"
        });
    }
};

module.exports = {
    authenticate
};