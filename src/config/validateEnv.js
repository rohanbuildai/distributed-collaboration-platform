
const PLACEHOLDER_SECRETS = [
    "your_jwt_secret_here",
    "secret",
    "changeme",
    "change_me",
    "your_secret_here",
];

function validateEnv() {
    const secret = process.env.JWT_ACCESS_SECRET;
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN;

    if (!secret || secret.trim().length < 32) {
        throw new Error(
            "JWT_ACCESS_SECRET must be configured with at least 32 characters."
        );
    }

    if (PLACEHOLDER_SECRETS.includes(secret.trim().toLowerCase())) {
        throw new Error(
            "JWT_ACCESS_SECRET contains a placeholder value. Configure a secure secret."
        );
    }

    if (!expiresIn || !expiresIn.trim()) {
        throw new Error("JWT_ACCESS_EXPIRES_IN must be configured.");
    }
}

module.exports = validateEnv;
