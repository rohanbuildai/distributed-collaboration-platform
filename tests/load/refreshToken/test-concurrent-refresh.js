
const assert = require("node:assert/strict");

const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;
const baseUrl = process.env.BASE_URL || "http://localhost:3000";

const loginUrl = `${baseUrl}/api/v1/auth/login`;
const refreshUrl = `${baseUrl}/api/v1/auth/refresh`;

if (!email || !password) {
    throw new Error(
        "Set TEST_EMAIL and TEST_PASSWORD environment variables."
    );
}

function getCookie(setCookies, name) {
    const cookie = setCookies.find(value =>
        value.startsWith(`${name}=`)
    );

    return cookie ? cookie.split(";")[0] : null;
}

async function login() {
    const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        throw new Error(
            `Login failed: ${response.status} ${await response.text()}`
        );
    }

    const cookies = response.headers.getSetCookie();
    const refreshCookie = getCookie(cookies, "refreshToken");

    assert.ok(refreshCookie, "Login must set a refreshToken cookie.");

    return refreshCookie;
}

async function refresh(cookie) {
    const response = await fetch(refreshUrl, {
        method: "POST",
        headers: {
            Cookie: cookie
        }
    });

    const body = await response.json();
    const cookies = response.headers.getSetCookie();

    return {
        status: response.status,
        body,
        refreshCookie: getCookie(cookies, "refreshToken")
    };
}

async function main() {
    const originalCookie = await login();

    // Send the same refresh token in two concurrent requests.
    const results = await Promise.all([
        refresh(originalCookie),
        refresh(originalCookie)
    ]);

    console.dir(
        results.map(({ status, body }) => ({ status, body })),
        { depth: null }
    );

    assert.deepEqual(
        results.map(result => result.status).sort((a, b) => a - b),
        [200, 401],
        "Expected one successful refresh and one rejected reuse."
    );

    const successfulRefresh = results.find(
        result => result.status === 200
    );

    assert.ok(
        successfulRefresh.refreshCookie,
        "Successful refresh must set a new refreshToken cookie."
    );

    assert.equal(
        successfulRefresh.body.success,
        true,
        "Successful refresh should return success: true."
    );

    // Reuse of the concurrent winner's token should fail if the
    // losing request revoked the entire token family.
    const reuseResult = await refresh(successfulRefresh.refreshCookie);

    console.log("New-token reuse check:", {
        status: reuseResult.status,
        body: reuseResult.body
    });

    assert.equal(
        reuseResult.status,
        401,
        "The newly rotated token should be rejected after family revocation."
    );

    console.log("PASS: concurrent refresh and token-family revocation verified.");
}

main().catch(error => {
    console.error("FAIL:", error);
    process.exitCode = 1;
});
