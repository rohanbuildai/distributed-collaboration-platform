
const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../src/config/database");

const makeDocumentContent = (text) => ({
    type: "doc",
    content: [
        {
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text,
                },
            ],
        },
    ],
});

describe("Document Versions API integration", () => {
    let ownerAgent;
    let viewerAgent;

    let ownerEmail;
    let viewerEmail;

    let documentId;
    let ownerId;
    let versionIds = [];

    beforeAll(async () => {
        ownerAgent = request.agent(app);
        viewerAgent = request.agent(app);

        ownerEmail = `version-owner-${Date.now()}@example.com`;
        viewerEmail = `version-viewer-${Date.now()}@example.com`;

        // Register owner
        await ownerAgent
            .post("/api/v1/auth/register")
            .send({
                name: "Version Owner",
                email: ownerEmail,
                password: "TestPassword123!",
            })
            .expect(201);

        await ownerAgent
            .post("/api/v1/auth/login")
            .send({
                email: ownerEmail,
                password: "TestPassword123!",
            })
            .expect(200);

        // Register viewer
        await viewerAgent
            .post("/api/v1/auth/register")
            .send({
                name: "Version Viewer",
                email: viewerEmail,
                password: "TestPassword123!",
            })
            .expect(201);

        await viewerAgent
            .post("/api/v1/auth/login")
            .send({
                email: viewerEmail,
                password: "TestPassword123!",
            })
            .expect(200);

        // Get owner ID
        const ownerResponse = await ownerAgent
            .get("/api/v1/auth/me")
            .expect(200);

        ownerId = ownerResponse.body.userId;

        // Create a dedicated document for version tests
        const documentResponse = await ownerAgent
            .post("/api/v1/documents")
            .send({
                title: "Version History Test",
                content: makeDocumentContent("Original content"),
            })
            .expect(201);

        documentId = documentResponse.body.data.id;

        // First update creates a snapshot of the original document
        await ownerAgent
            .patch(`/api/v1/documents/${documentId}`)
            .send({
                title: "Updated Document 1",
                content: makeDocumentContent("First updated content"),
            })
            .expect(200);

        // Second update creates another snapshot
        await ownerAgent
            .patch(`/api/v1/documents/${documentId}`)
            .send({
                title: "Updated Document 2",
                content: makeDocumentContent("Second updated content"),
            })
            .expect(200);

        // Third update creates another snapshot
        await ownerAgent
            .patch(`/api/v1/documents/${documentId}`)
            .send({
                title: "Updated Document 3",
                content: makeDocumentContent("Third updated content"),
            })
            .expect(200);
    });

    afterAll(async () => {
        if (documentId) {
            await pool.query(
                "DELETE FROM documents WHERE id = $1",
                [documentId]
            );
        }

        if (ownerEmail) {
            await pool.query(
                "DELETE FROM users WHERE email = $1",
                [ownerEmail]
            );
        }

        if (viewerEmail) {
            await pool.query(
                "DELETE FROM users WHERE email = $1",
                [viewerEmail]
            );
        }
    });

    describe("GET /api/v1/documents/:documentId/versions", () => {
        test("allows the owner to fetch document version history", async () => {
            const response = await ownerAgent
                .get(`/api/v1/documents/${documentId}/versions`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(3);

            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.limit).toBe(10);

            versionIds = response.body.data.map((version) => version.id);
        });

        test("returns versions in descending version-number order", async () => {
            const response = await ownerAgent
                .get(`/api/v1/documents/${documentId}/versions`)
                .expect(200);

            const versionNumbers = response.body.data.map(
                (version) => Number(version.version_number)
            );

            const sortedNumbers = [...versionNumbers].sort(
                (a, b) => b - a
            );

            expect(versionNumbers).toEqual(sortedNumbers);
        });

        test("returns the previous document state in version history", async () => {
            const response = await ownerAgent
                .get(`/api/v1/documents/${documentId}/versions`)
                .expect(200);

            const originalVersion = response.body.data.find(
                (version) => version.version_number === 1
            );

            expect(originalVersion).toBeDefined();
            expect(originalVersion.title).toBe("Version History Test");
            expect(originalVersion.content).toEqual(
                makeDocumentContent("Original content")
            );
        });

        test("supports pagination with a limit", async () => {
            const response = await ownerAgent
                .get(`/api/v1/documents/${documentId}/versions`)
                .query({ limit: 1 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.pagination.limit).toBe(1);
            expect(response.body.pagination.hasNextPage).toBe(true);
            expect(response.body.pagination.nextCursor).toBeDefined();
        });

        test("supports fetching the next page using the cursor", async () => {
            const firstPage = await ownerAgent
                .get(`/api/v1/documents/${documentId}/versions`)
                .query({ limit: 1 })
                .expect(200);

            const cursor = firstPage.body.pagination.nextCursor;

            const secondPage = await ownerAgent
                .get(`/api/v1/documents/${documentId}/versions`)
                .query({
                    limit: 1,
                    cursor,
                })
                .expect(200);

            expect(secondPage.body.data).toHaveLength(1);

            expect(
                Number(secondPage.body.data[0].version_number)
            ).toBeLessThan(
                Number(firstPage.body.data[0].version_number)
            );
        });

        test("rejects an invalid document ID", async () => {
            await ownerAgent
                .get("/api/v1/documents/invalid-id/versions")
                .expect(400);
        });

        test("rejects an invalid pagination limit", async () => {
            await ownerAgent
                .get(`/api/v1/documents/${documentId}/versions`)
                .query({ limit: 0 })
                .expect(400);
        });

        test("returns 404 when the document does not exist", async () => {
            await ownerAgent
                .get("/api/v1/documents/999999999/versions")
                .expect(404);
        });

        test("rejects unauthenticated requests", async () => {
            await request(app)
                .get(`/api/v1/documents/${documentId}/versions`)
                .expect(401);
        });
    });

    describe("GET /api/v1/documents/:documentId/versions/:versionId", () => {
        test("allows the owner to fetch a specific version", async () => {
            const historyResponse = await ownerAgent
                .get(`/api/v1/documents/${documentId}/versions`)
                .expect(200);

            const version = historyResponse.body.data[0];

            const response = await ownerAgent
                .get(
                    `/api/v1/documents/${documentId}/versions/${version.id}`
                )
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(String(response.body.data.id)).toBe(
                String(version.id)
            );
            expect(response.body.data.title).toBe(version.title);
            expect(response.body.data.content).toEqual(version.content);
        });

        test("rejects an invalid version ID", async () => {
            await ownerAgent
                .get(`/api/v1/documents/${documentId}/versions/invalid-id`)
                .expect(400);
        });

        test("returns 404 for a version that does not exist", async () => {
            await ownerAgent
                .get(`/api/v1/documents/${documentId}/versions/999999999`)
                .expect(404);
        });

        test("rejects unauthenticated requests", async () => {
            await request(app)
                .get(`/api/v1/documents/${documentId}/versions/1`)
                .expect(401);
        });
    });

    describe("Document version access permissions", () => {
        test("allows a shared viewer to access version history", async () => {
            const viewerResponse = await viewerAgent
                .get("/api/v1/auth/me")
                .expect(200);

            const viewerId = viewerResponse.body.userId;

            await ownerAgent
                .post(`/api/v1/documents/${documentId}/share`)
                .send({
                    sharedWithUserId: viewerId,
                    permission: "viewer",
                })
                .expect(201);

            const response = await viewerAgent
                .get(`/api/v1/documents/${documentId}/versions`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        test("allows a shared viewer to fetch a specific version", async () => {
            const historyResponse = await viewerAgent
                .get(`/api/v1/documents/${documentId}/versions`)
                .expect(200);

            const version = historyResponse.body.data[0];

            const response = await viewerAgent
                .get(
                    `/api/v1/documents/${documentId}/versions/${version.id}`
                )
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(String(response.body.data.id)).toBe(
                String(version.id)
            );
        });

        test("does not allow an unrelated user to access version history", async () => {
            const unrelatedAgent = request.agent(app);
            const unrelatedEmail =
                `version-unrelated-${Date.now()}@example.com`;

            try {
                await unrelatedAgent
                    .post("/api/v1/auth/register")
                    .send({
                        name: "Unrelated User",
                        email: unrelatedEmail,
                        password: "TestPassword123!",
                    })
                    .expect(201);

                await unrelatedAgent
                    .post("/api/v1/auth/login")
                    .send({
                        email: unrelatedEmail,
                        password: "TestPassword123!",
                    })
                    .expect(200);

                await unrelatedAgent
                    .get(`/api/v1/documents/${documentId}/versions`)
                    .expect(404);
            } finally {
                await pool.query(
                    "DELETE FROM users WHERE email = $1",
                    [unrelatedEmail]
                );
            }
        });
    });

    describe("Version history integrity", () => {
        test("does not create a version when an update fails", async () => {
            const beforeResponse = await ownerAgent
                .get(`/api/v1/documents/${documentId}/versions`)
                .expect(200);

            const beforeCount = beforeResponse.body.data.length;

            await ownerAgent
                .patch(`/api/v1/documents/${documentId}`)
                .send({})
                .expect(400);

            const afterResponse = await ownerAgent
                .get(`/api/v1/documents/${documentId}/versions`)
                .expect(200);

            expect(afterResponse.body.data).toHaveLength(beforeCount);
        });

        test("does not allow a viewer to update the document", async () => {
            await viewerAgent
                .patch(`/api/v1/documents/${documentId}`)
                .send({
                    title: "Viewer Unauthorized Update",
                    content: makeDocumentContent("Unauthorized content"),
                })
                .expect(403);
        });
    });
});
