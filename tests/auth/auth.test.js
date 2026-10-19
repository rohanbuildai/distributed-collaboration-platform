
const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../src/config/database");

describe("Authentication API integration", () => {
    let agent;
    let testEmail;

    beforeAll(async () => {
        agent = request.agent(app);
        testEmail = `auth-test-${Date.now()}@example.com`;

        await agent
            .post("/api/v1/auth/register")
            .send({
                name: "Auth Test User",
                email: testEmail,
                password: "TestPassword123!"
            })
            .expect(201);

        await agent
            .post("/api/v1/auth/login")
            .send({
                email: testEmail,
                password: "TestPassword123!"
            })
            .expect(200);
    });

    afterAll(async () => {
        if (testEmail) {
            await pool.query(
                "DELETE FROM users WHERE email = $1",
                [testEmail]
            );
        }

        await pool.end();
    });

    test("rotates the refresh token successfully", async () => {
        const response = await agent
            .post("/api/v1/auth/refresh")
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.headers["set-cookie"]).toBeDefined();

        await agent
            .get("/api/v1/auth/me")
            .expect(200);
    });

    
    test("rejects an invalid refresh token", async () => {
        const invalidAgent = request.agent(app);

        await invalidAgent
            .post("/api/v1/auth/refresh")
            .set("Cookie", ["refreshToken=invalid-refresh-token"])
            .expect(401);
    });

    
    test("logs out and revokes the refresh token", async () => {
        const logoutAgent = request.agent(app);
        const email = `logout-test-${Date.now()}@example.com`;

        await logoutAgent
            .post("/api/v1/auth/register")
            .send({
                name: "Logout Test User",
                email,
                password: "TestPassword123!"
            })
            .expect(201);

        await logoutAgent
            .post("/api/v1/auth/login")
            .send({
                email,
                password: "TestPassword123!"
            })
            .expect(200);

        await logoutAgent
            .post("/api/v1/auth/logout")
            .expect(200);

        await logoutAgent
            .post("/api/v1/auth/refresh")
            .expect(401);

        await pool.query(
            "DELETE FROM users WHERE email = $1",
            [email]
        );
    });

    
    test("revokes a token family when a revoked refresh token is reused", async () => {
        const reuseAgent = request.agent(app);
        const email = `reuse-test-${Date.now()}@example.com`;

        try {
            await reuseAgent
                .post("/api/v1/auth/register")
                .send({
                    name: "Reuse Test User",
                    email,
                    password: "TestPassword123!"
                })
                .expect(201);

            const loginResponse = await reuseAgent
                .post("/api/v1/auth/login")
                .send({
                    email,
                    password: "TestPassword123!"
                })
                .expect(200);

            const originalCookie = loginResponse.headers["set-cookie"]
                .find(cookie => cookie.startsWith("refreshToken="));

            expect(originalCookie).toBeDefined();

            const originalRefreshCookie = originalCookie.split(";")[0];

            await reuseAgent
                .post("/api/v1/auth/refresh")
                .expect(200);

            await request(app)
                .post("/api/v1/auth/refresh")
                .set("Cookie", originalRefreshCookie)
                .expect(401);

            await reuseAgent
                .post("/api/v1/auth/refresh")
                .expect(401);
        } finally {
            await pool.query(
                "DELETE FROM users WHERE email = $1",
                [email]
            );
        }
    });

});
