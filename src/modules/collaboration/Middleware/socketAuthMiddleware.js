
const jwt = require("jsonwebtoken");

function getAccessToken(socket) {

    const authToken = socket.handshake.auth?.token;

    if (authToken) {
        return authToken;
    }

    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
        return null;
    }

    const cookies = cookieHeader.split(";");

    for (const cookie of cookies) {
        const [name, ...valueParts] = cookie.trim().split("=");

        if (name === "accessToken") {
            return decodeURIComponent(valueParts.join("="));
        }
    }

    return null;
}

function socketAuthMiddleware(socket, next) {
    try {
        const token = getAccessToken(socket);

        if (!token) {
            return next(new Error("Authentication required"));
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET
        );

        if (decoded.type !== "access" || !decoded.sub) {
            return next(new Error("Invalid access token"));
        }

        socket.user = {
            id: decoded.sub
        };

        socket.data.userId = decoded.sub;

        return next();
    } catch (error) {
        return next(new Error("Invalid or expired access token"));
    }
}

module.exports = socketAuthMiddleware;
