
const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../src/config/database");

describe("Documents API integration", () => {
    let documentId;
    let agent;
    let testEmail;
    let ownerUserId;

    let secondAgent;
    let secondTestEmail;
    let secondUserId;

    let strangerAgent;
    let strangerTestEmail;
    let strangerUserId;

    beforeAll(async () => {
        // --------------------------------------------------
        // REGISTER AND LOGIN DOCUMENT OWNER
        // --------------------------------------------------

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

        const ownerResponse = await agent
            .get("/api/v1/auth/me")
            .expect(200);

        ownerUserId = ownerResponse.body.userId;

        // --------------------------------------------------
        // REGISTER AND LOGIN SECOND USER (RECIPIENT)
        // --------------------------------------------------

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

        const secondUserResponse = await secondAgent
            .get("/api/v1/auth/me")
            .expect(200);

        secondUserId = secondUserResponse.body.userId;

        // --------------------------------------------------
        // REGISTER AND LOGIN THIRD USER (STRANGER)
        // --------------------------------------------------

        strangerAgent = request.agent(app);
        strangerTestEmail = `doc-test-stranger-${Date.now()}@example.com`;

        await strangerAgent
            .post("/api/v1/auth/register")
            .send({
                name: "Stranger Test User",
                email: strangerTestEmail,
                password: "TestPassword123!"
            })
            .expect(201);

        await strangerAgent
            .post("/api/v1/auth/login")
            .send({
                email: strangerTestEmail,
                password: "TestPassword123!"
            })
            .expect(200);

        const strangerResponse = await strangerAgent
            .get("/api/v1/auth/me")
            .expect(200);

        strangerUserId = strangerResponse.body.userId;

        // --------------------------------------------------
        // CREATE INITIAL DOCUMENT
        // --------------------------------------------------

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
        // Owner deletion cascades to owned documents and shares.
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

        if (strangerTestEmail) {
            await pool.query(
                "DELETE FROM users WHERE email = $1",
                [strangerTestEmail]
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
    // DOCUMENT SHARING AUTHORIZATION TESTS
    // --------------------------------------------------

    describe("Document Sharing Authorization API", () => {

        test("allows owner to share a document with a viewer", async () => {
            const response = await agent
                .post(`/api/v1/documents/${documentId}/share`)
                .send({
                    sharedWithUserId: secondUserId,
                    permission: "viewer"
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.permission).toBe("viewer");
        });

        test("rejects invalid sharing permission", async () => {
            await agent
                .post(`/api/v1/documents/${documentId}/share`)
                .send({
                    sharedWithUserId: secondUserId,
                    permission: "admin"
                })
                .expect(400);
        });

        test("rejects sharing with a nonexistent recipient", async () => {
            await agent
                .post(`/api/v1/documents/${documentId}/share`)
                .send({
                    sharedWithUserId: "999999999",
                    permission: "viewer"
                })
                .expect(404);
        });

        test("prevents owner from sharing a document with themselves", async () => {
            await agent
                .post(`/api/v1/documents/${documentId}/share`)
                .send({
                    sharedWithUserId: ownerUserId,
                    permission: "viewer"
                })
                .expect(400);
        });

        test("allows viewer to read the shared document", async () => {
            const response = await secondAgent
                .get(`/api/v1/documents/${documentId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test("prevents viewer from updating the document", async () => {
            await secondAgent
                .patch(`/api/v1/documents/${documentId}`)
                .send({
                    title: "Viewer Unauthorized Update"
                })
                .expect(403);
        });

        test("allows owner to change viewer permission to editor", async () => {
            const response = await agent
                .patch(`/api/v1/documents/${documentId}/share/${secondUserId}`)
                .send({
                    permission: "editor"
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.permission).toBe("editor");
        });

        test("allows editor to update the shared document", async () => {
            const response = await secondAgent
                .patch(`/api/v1/documents/${documentId}`)
                .send({
                    title: "Updated By Editor"
                })
                .expect(200);

            expect(response.body.data.title).toBe("Updated By Editor");
        });

        test("allows owner to change editor permission back to viewer", async () => {
            const response = await agent
                .patch(`/api/v1/documents/${documentId}/share/${secondUserId}`)
                .send({
                    permission: "viewer"
                })
                .expect(200);

            expect(response.body.data.permission).toBe("viewer");
        });

        test("prevents stranger from reading a document", async () => {
            await strangerAgent
                .get(`/api/v1/documents/${documentId}`)
                .expect(404);
        });

        test("prevents stranger from updating a document", async () => {
            await strangerAgent
                .patch(`/api/v1/documents/${documentId}`)
                .send({
                    title: "Stranger Unauthorized Update"
                })
                .expect(404);
        });

        test("prevents stranger from changing sharing permissions", async () => {
            await strangerAgent
                .patch(`/api/v1/documents/${documentId}/share/${secondUserId}`)
                .send({
                    permission: "editor"
                })
                .expect(404);
        });

        test("owner can revoke the authorization test share", async () => {
            await agent
                .delete(`/api/v1/documents/${documentId}/share/${secondUserId}`)
                .expect(200);

            await secondAgent
                .get(`/api/v1/documents/${documentId}`)
                .expect(404);
        });
    });

    // --------------------------------------------------
    // SHARED DOCUMENTS PAGINATION TESTS
    // --------------------------------------------------

    describe("Shared Documents Pagination API", () => {

        test("returns shared documents using cursor pagination", async () => {

            // Create three documents to ensure two pages exist.
            const firstDocument = await agent
                .post("/api/v1/documents")
                .send({
                    title: "Shared Pagination Document 1",
                    content: "Test content 1"
                })
                .expect(201);

            const secondDocument = await agent
                .post("/api/v1/documents")
                .send({
                    title: "Shared Pagination Document 2",
                    content: "Test content 2"
                })
                .expect(201);

            const thirdDocument = await agent
                .post("/api/v1/documents")
                .send({
                    title: "Shared Pagination Document 3",
                    content: "Test content 3"
                })
                .expect(201);

            const paginationDocumentIds = [
                firstDocument.body.data.id,
                secondDocument.body.data.id,
                thirdDocument.body.data.id
            ];

            // Share all three documents with the recipient.
            for (let i = 0; i < paginationDocumentIds.length; i++) {
                await agent
                    .post(`/api/v1/documents/${paginationDocumentIds[i]}/share`)
                    .send({
                        sharedWithUserId: secondUserId,
                        permission: "viewer"
                    })
                    .expect(201);
            }

            // First page.
            const firstPage = await secondAgent
                .get("/api/v1/documents/shared")
                .query({ limit: 2 })
                .expect(200);

            expect(firstPage.body.success).toBe(true);
            expect(firstPage.body.data).toHaveLength(2);
            expect(firstPage.body.pagination.limit).toBe(2);
            expect(firstPage.body.pagination.hasNextPage).toBe(true);
            expect(firstPage.body.pagination.nextCursor).toBeDefined();

            // Second page.
            const secondPage = await secondAgent
                .get("/api/v1/documents/shared")
                .query({
                    limit: 2,
                    cursor: firstPage.body.pagination.nextCursor
                })
                .expect(200);

            expect(secondPage.body.success).toBe(true);
            expect(secondPage.body.data).toHaveLength(1);
            expect(secondPage.body.pagination.hasNextPage).toBe(false);
            expect(secondPage.body.pagination.nextCursor).toBeNull();

            // Verify that the two pages contain three distinct documents.
            const firstPageIds = firstPage.body.data.map(
                document => String(document.document_id)
            );

            const secondPageIds = secondPage.body.data.map(
                document => String(document.document_id)
            );

            const allPageIds = [...firstPageIds, ...secondPageIds];

            expect(new Set(allPageIds).size).toBe(3);
        });

        test.each(["0", "101", "1.5", "abc"])(
            "rejects invalid shared-document pagination limit: %s",
            async (limit) => {
                await secondAgent
                    .get("/api/v1/documents/shared")
                    .query({ limit })
                    .expect(400);
            }
        );

        test.each([
            "not-base64!",
            Buffer.from("{invalid-json").toString("base64"),
            Buffer.from(
                JSON.stringify({
                    createdAt: "2026-01-01T00:00:00.000Z",
                    id: "0"
                })
            ).toString("base64"),
            Buffer.from(
                JSON.stringify({
                    createdAt: "invalid-date",
                    id: "1"
                })
            ).toString("base64")
        ])(
            "rejects malformed shared-document pagination cursor",
            async (cursor) => {
                await secondAgent
                    .get("/api/v1/documents/shared")
                    .query({ cursor })
                    .expect(400);
            }
        );

        test("accepts the minimum valid shared-document pagination limit", async () => {
            const response = await secondAgent
                .get("/api/v1/documents/shared")
                .query({ limit: 1 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pagination.limit).toBe(1);
        });
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
                document => String(document.document_id)
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

            // Cleanup.
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

            // Cleanup.
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
