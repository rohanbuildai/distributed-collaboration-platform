
const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../src/config/database");

describe("Documents API integration", () => {
    let documentId;
    let agent;
    let testEmail;
    let secondAgent;
    let secondTestEmail;
    let secondUserId;

    beforeAll(async () => {
        agent = request.agent(app);
        testEmail = `doc-test-${Date.now()}@example.com`;

        // Register first user (document owner)
        await agent
            .post("/api/v1/auth/register")
            .send({
                name: "Document Test User",
                email: testEmail,
                password: "TestPassword123!"
            })
            .expect(201);

        // Login first user
        await agent
            .post("/api/v1/auth/login")
            .send({
                email: testEmail,
                password: "TestPassword123!"
            })
            .expect(200);

        // Register second user (recipient)
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

        // Login second user
        await secondAgent
            .post("/api/v1/auth/login")
            .send({
                email: secondTestEmail,
                password: "TestPassword123!"
            })
            .expect(200);

        // Get second user's ID
        const secondUserResponse = await secondAgent
            .get("/api/v1/auth/me")
            .expect(200);

        secondUserId = secondUserResponse.body.userId;

        // Create initial document
        const response = await agent
            .post("/api/v1/documents")
            .send({
                title: "Integration Test Document",
                content: "Created through Supertest"
            })
            .expect(201);

        documentId = response.body.data.id;
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

    // --------------------------------------------------
    // DOCUMENT CRUD TESTS
    // --------------------------------------------------

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

        expect(String(response.body.data.id)).toBe(
            String(documentId)
        );
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

    test("gets the document belonging to the authenticated user", async () => {
        expect(documentId).toBeDefined();

        const response = await agent
            .get(`/api/v1/documents/${documentId}`)
            .expect(200);

        expect(response.body.success).toBe(true);

        expect(String(response.body.data.id)).toBe(
            String(documentId)
        );
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

    // --------------------------------------------------
    // AUTHENTICATION TESTS
    // --------------------------------------------------

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

    // --------------------------------------------------
    // DOCUMENT PAGINATION TESTS
    // --------------------------------------------------

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

    // --------------------------------------------------
    // DOCUMENT SHARING REVOCATION TESTS
    // --------------------------------------------------

    describe("Document Sharing Revocation API", () => {

        const createShare = async () => {
            await agent
                .post(`/api/v1/documents/${documentId}/share`)
                .send({
                    sharedWithUserId: secondUserId,
                    permission: "viewer"
                })
                .expect(201);
        };

        test("allows the owner to revoke document sharing", async () => {
            await createShare();

            const response = await agent
                .delete(
                    `/api/v1/documents/${documentId}/share/${secondUserId}`
                )
                .expect(200);

            expect(response.body.success).toBe(true);

            expect(response.body.message).toBe(
                "Document sharing revoked successfully"
            );

            // Recipient should immediately lose read access.
            await secondAgent
                .get(`/api/v1/documents/${documentId}`)
                .expect(404);

            // Recipient should no longer see the document
            // in their shared documents list.
            const sharedResponse = await secondAgent
                .get("/api/v1/documents/shared")
                .expect(200);

            const sharedDocumentIds = sharedResponse.body.data.map(
                document => String(document.id)
            );

            expect(sharedDocumentIds).not.toContain(
                String(documentId)
            );
        });

        test("rejects revocation when sharing record does not exist", async () => {
            await agent
                .delete(
                    `/api/v1/documents/${documentId}/share/${secondUserId}`
                )
                .expect(404);
        });

        test("prevents the recipient from revoking their own access", async () => {
            await createShare();

            await secondAgent
                .delete(
                    `/api/v1/documents/${documentId}/share/${secondUserId}`
                )
                .expect(404);

            // Verify the share still exists.
            await secondAgent
                .get(`/api/v1/documents/${documentId}`)
                .expect(200);

            // Cleanup
            await agent
                .delete(
                    `/api/v1/documents/${documentId}/share/${secondUserId}`
                )
                .expect(200);
        });

        test("rejects unauthenticated revocation", async () => {
            await createShare();

            await request(app)
                .delete(
                    `/api/v1/documents/${documentId}/share/${secondUserId}`
                )
                .expect(401);

            // Verify the share still exists.
            await secondAgent
                .get(`/api/v1/documents/${documentId}`)
                .expect(200);

            // Cleanup
            await agent
                .delete(
                    `/api/v1/documents/${documentId}/share/${secondUserId}`
                )
                .expect(200);
        });

        test("rejects revocation for a nonexistent document", async () => {
            await agent
                .delete(
                    `/api/v1/documents/999999999/share/${secondUserId}`
                )
                .expect(404);
        });
    });

    // --------------------------------------------------
    // DOCUMENT DELETION TEST
    // Keep this test last because it permanently deletes
    // the document used by the tests above.
    // --------------------------------------------------

    test("allows the owner to delete a document", async () => {
        await agent
            .delete(`/api/v1/documents/${documentId}`)
            .expect(204);

        await agent
            .get(`/api/v1/documents/${documentId}`)
            .expect(404);
    });

});
