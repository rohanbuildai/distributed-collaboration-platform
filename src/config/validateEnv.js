
const PLACEHOLDER_SECRETS = [
    "your_jwt_secret_here",
    "secret",
    "changeme",
    "change_me",
    "your_secret_here",
];

const REQUIRED_ENV_VARIABLES = [
    "JWT_ACCESS_SECRET",
    "JWT_ACCESS_EXPIRES_IN",
    "DATABASE_HOST",
    "DATABASE_NAME",
    "DATABASE_USER",
    "DATABASE_PASSWORD",
    "CLIENT_URL",
];

function validateEnv() {
    const missingVariables = REQUIRED_ENV_VARIABLES.filter(
        (key) => !process.env[key] || !process.env[key].trim()
    );

    if (missingVariables.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVariables.join(", ")}`
        );
    }

    const secret = process.env.JWT_ACCESS_SECRET.trim();

    if (secret.length < 32) {
        throw new Error(
            "JWT_ACCESS_SECRET must contain at least 32 characters."
        );
    }

    if (PLACEHOLDER_SECRETS.includes(secret.toLowerCase())) {
        throw new Error(
            "JWT_ACCESS_SECRET contains a placeholder value. Configure a secure secret."
        );
    }

    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN.trim();

    const validExpiryFormat =
        /^\d+(?:\.\d+)?(?:ms|s|m|h|d|w|y)$/i;

    if (!validExpiryFormat.test(expiresIn)) {
        throw new Error(
            "JWT_ACCESS_EXPIRES_IN must use a valid duration such as 15m, 1h or 7d."
        );
    }

    if (process.env.DATABASE_PORT) {
        const port = Number(process.env.DATABASE_PORT);

        if (
            !Number.isInteger(port) ||
            port < 1 ||
            port > 65535
        ) {
            throw new Error(
                "DATABASE_PORT must be a valid port between 1 and 65535."
            );
        }
    }

    const allowedEnvironments = [
        "development",
        "test",
        "production",
    ];

    if (
        process.env.NODE_ENV &&
        !allowedEnvironments.includes(process.env.NODE_ENV)
    ) {
        throw new Error(
            "NODE_ENV must be development, test or production."
        );
    }

    const allowedOrigins = process.env.CLIENT_URL
        .split(",")
        .map((origin) => origin.trim());

    for (const origin of allowedOrigins) {
        try {
            const parsedOrigin = new URL(origin);

            if (
                !["http:", "https:"].includes(parsedOrigin.protocol) ||
                parsedOrigin.origin !== origin
            ) {
                throw new Error();
            }
        } catch {
            throw new Error(
                `Invalid CLIENT_URL origin: ${origin}`
            );
        }
    }
}

module.exports = validateEnv;
