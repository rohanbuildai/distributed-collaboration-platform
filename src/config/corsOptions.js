
const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",")
          .map((origin) => origin.trim().replace(/\/+$/, ""))
          .filter(Boolean)
    : [];

function isAllowedOrigin(origin) {
    if (!origin) {
        return true;
    }

    const normalizedOrigin = origin.trim().replace(/\/+$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
        return true;
    }

    // In development or test, allow any localhost or 127.0.0.1 origin
    if (process.env.NODE_ENV !== "production") {
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
            return true;
        }
    }

    return false;
}

const corsOptions = {
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }

        console.warn(
            `[CORS] Blocked request from origin: "${origin}". Allowed origins: ${
                allowedOrigins.join(", ") || "(none)"
            }`
        );
        return callback(null, false);
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
    ],

    optionsSuccessStatus: 204,
};

module.exports = corsOptions;
