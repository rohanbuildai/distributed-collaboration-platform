
const request = require("supertest");
const app = require("../../src/app");

describe("Health endpoint", () => {
    test("GET /api/v1/health returns 200", async () => {
        const response = await request(app)
            .get("/api/v1/health");

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message: "Collaboration platform is running"
        });
    });
});
