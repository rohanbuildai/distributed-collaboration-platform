
const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../src/config/database");

describe("Documents API integration", () => {
    let documentId;
    let agent;
    let testEmail;
    let secondAgent;
    let secondTestEmail;

    beforeAll(async () => {
        agent = request.agent(app);
        testEmail = `doc-test-${Date.now()}@example.com`;

        await agent
            .post("/api/v1/auth/register")
            .send({
                name: "Document Test User",
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

        secondAgent = request.agent(app);
        secondTestEmail = `doc-test-second-${Date.now()}@example.com`;

        await secondAgent
            .post("/api/v1/auth/register")
            .send({
                name: "Second Document Test User",
                email: secondTestEmail,
                password: "TestPassword123!"
            })
            .expect(201);

        await secondAgent
            .post("/api/v1/auth/login")
            .send({
                email: secondTestEmail,
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

        if (secondTestEmail) {
            await pool.query(
                "DELETE FROM users WHERE email = $1",
                [secondTestEmail]
        );
}

        await pool.end();
    });

    test("creates a document for the authenticated user", async () => {
        const response = await agent
            .post("/api/v1/documents")
            .send({
                title: "Integration Test Document",
                content: "Created through Supertest"
            })
            .expect(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(
            "Integration Test Document"
        );
        expect(response.body.data.content).toBe(
            "Created through Supertest"
        );
        expect(response.body.data.id).toBeDefined();
        documentId = response.body.data.id;
    });

    test("gets a document by ID", async () => {
        const response = await agent
            .get(`/api/v1/documents/${documentId}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(String(response.body.data.id)).toBe(String(documentId));
    });

    test("updates a document", async () => {
        const response = await agent
            .patch(`/api/v1/documents/${documentId}`)
            .send({
                title: "Updated Integration Test Document",
                content: "Updated content"
            })
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(
            "Updated Integration Test Document"
        );
        expect(response.body.data.content).toBe("Updated content");
    });

    test("rejects an empty document update", async () => {
        await agent
            .patch(`/api/v1/documents/${documentId}`)
            .send({})
            .expect(400);
    });

    
    test("lists the authenticated user's documents", async () => {
        const response = await agent
            .get("/api/v1/documents")
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test("rejects document access without authentication", async () => {
        await request(app)
            .get("/api/v1/documents")
            .expect(401);
    });

    test("prevents another user from viewing a document", async () => {
    await secondAgent
        .get(`/api/v1/documents/${documentId}`)
        .expect(404);
    });

    test("prevents another user from updating a document", async () => {
        await secondAgent
            .patch(`/api/v1/documents/${documentId}`)
            .send({
                title: "Unauthorized Update",
                content: "This should not be saved"
            })
            .expect(404);
    });

    test("prevents another user from deleting a document", async () => {
        await secondAgent
            .delete(`/api/v1/documents/${documentId}`)
            .expect(404);

        // Confirm the original owner can still access it.
        await agent
            .get(`/api/v1/documents/${documentId}`)
            .expect(200);
    });

    test("allows the owner to delete a document", async () => {
    await agent
        .delete(`/api/v1/documents/${documentId}`)
        .expect(204);

    await agent
        .get(`/api/v1/documents/${documentId}`)
        .expect(404);
    });

    test("rejects a document with a missing title", async () => {
    await agent
        .post("/api/v1/documents")
        .send({
            content: "Document without a title"
        })
        .expect(400);
    });

    test("rejects an invalid document ID", async () => {
        await agent
            .get("/api/v1/documents/invalid-id")
            .expect(400);
    });

    test("returns the current authenticated user's ID", async () => {
    const response = await agent
        .get("/api/v1/auth/me")
        .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.userId).toBeDefined();
    });

    test("rejects current-user access without authentication", async () => {
        await request(app)
            .get("/api/v1/auth/me")
            .expect(401);
    });

    
    test.each(["0", "101", "1.5", "abc"])(
        "rejects invalid pagination limit: %s",
        async (limit) => {
            await agent
                .get(`/api/v1/documents?limit=${limit}`)
                .expect(400);
        }
    );

    test.each([
        "not-base64!",
        Buffer.from("{invalid-json").toString("base64"),
        Buffer.from(
            JSON.stringify({
                updatedAt: "2026-01-01T00:00:00.000Z",
                id: "0"
            })
        ).toString("base64")
    ])(
        "rejects malformed pagination cursor",
        async (cursor) => {
            await agent
                .get("/api/v1/documents")
                .query({ cursor })
                .expect(400);
        }
    );

    test("accepts the minimum valid pagination limit", async () => {
        const response = await agent
            .get("/api/v1/documents?limit=1")
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.pagination.limit).toBe(1);
    });


}); 
