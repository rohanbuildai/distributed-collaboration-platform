
const documentModel = require("../../src/modules/documents/Models/documentModel");
const documentShareModel = require("../../src/modules/documentShares/Models/documentShareModel");
const documentVersionModel = require("../../src/modules/documentVersions/Models/documentVersionModel");
const pool = require("../../src/config/database");

const {
    updateDocument
} = require("../../src/modules/documents/Services/documentService");

jest.mock("../../src/modules/documents/Models/documentModel", () => ({
    findDocumentByIdForUpdate: jest.fn(),
    updateDocument: jest.fn()
}));

jest.mock("../../src/modules/documentShares/Models/documentShareModel", () => ({
    findDocumentShare: jest.fn()
}));

jest.mock("../../src/modules/documentVersions/Models/documentVersionModel", () => ({
    getLatestVersionNumber: jest.fn(),
    createVersion: jest.fn()
}));

jest.mock("../../src/config/database", () => ({
    connect: jest.fn()
}));

describe("Document Service - Optimistic Concurrency Control", () => {
    let client;

    const document = {
        id: "123",
        owner_id: "owner-123",
        title: "Original Document",
        content: {
            type: "doc",
            content: [
                {
                    type: "paragraph"
                }
            ]
        },
        revision: 4
    };

    const updatedDocument = {
        ...document,
        title: "Updated Document",
        revision: 5
    };

    const validPayload = {
        documentId: "123",
        ownerId: "owner-123",
        title: "Updated Document",
        expectedRevision: 4
    };

    beforeEach(() => {
        jest.clearAllMocks();

        client = {
            query: jest.fn().mockResolvedValue({ rows: [] }),
            release: jest.fn()
        };

        pool.connect.mockResolvedValue(client);

        documentModel.findDocumentByIdForUpdate.mockResolvedValue({
            ...document
        });

        documentModel.updateDocument.mockResolvedValue({
            ...updatedDocument
        });

        documentVersionModel.getLatestVersionNumber.mockResolvedValue(3);

        documentVersionModel.createVersion.mockResolvedValue({
            id: "version-4",
            version_number: 4
        });

        documentShareModel.findDocumentShare.mockResolvedValue(null);
    });

    // --------------------------------------------------
    // SUCCESSFUL UPDATE
    // --------------------------------------------------

    describe("Successful update", () => {
        test("updates a document when expectedRevision matches", async () => {
            const result = await updateDocument(validPayload);

            expect(result).toEqual(updatedDocument);

            expect(documentModel.findDocumentByIdForUpdate)
                .toHaveBeenCalledWith({
                    documentId: "123",
                    client
                });

            expect(documentVersionModel.getLatestVersionNumber)
                .toHaveBeenCalledWith({
                    documentId: "123",
                    client
                });

            expect(documentVersionModel.createVersion)
                .toHaveBeenCalledWith({
                    documentId: "123",
                    versionNumber: 4,
                    title: "Original Document",
                    content: document.content,
                    editedBy: "owner-123",
                    client
                });

            expect(documentModel.updateDocument)
                .toHaveBeenCalledWith({
                    documentId: "123",
                    title: "Updated Document",
                    content: null,
                    expectedRevision: 4,
                    client
                });

            expect(client.query).toHaveBeenCalledWith("BEGIN");
            expect(client.query).toHaveBeenCalledWith("COMMIT");

            expect(client.release).toHaveBeenCalledTimes(1);
        });

        test("creates the snapshot before updating the document", async () => {
            await updateDocument(validPayload);

            const snapshotOrder =
                documentVersionModel.createVersion.mock.invocationCallOrder[0];

            const updateOrder =
                documentModel.updateDocument.mock.invocationCallOrder[0];

            expect(snapshotOrder).toBeLessThan(updateOrder);
        });

        test("allows an editor to update a shared document", async () => {
            documentModel.findDocumentByIdForUpdate.mockResolvedValue({
                ...document,
                owner_id: "different-owner"
            });

            documentShareModel.findDocumentShare.mockResolvedValue({
                permission: "editor"
            });

            await updateDocument({
                ...validPayload,
                ownerId: "editor-123"
            });

            expect(documentShareModel.findDocumentShare)
                .toHaveBeenCalledWith({
                    documentId: "123",
                    sharedWithUserId: "editor-123",
                    client
                });

            expect(documentModel.updateDocument)
                .toHaveBeenCalledTimes(1);
        });
    });

    // --------------------------------------------------
    // REVISION VALIDATION
    // --------------------------------------------------

    describe("Revision validation", () => {
        test("rejects missing expectedRevision", async () => {
            await expect(
                updateDocument({
                    ...validPayload,
                    expectedRevision: undefined
                })
            ).rejects.toMatchObject({
                statusCode: 400
            });

            expect(pool.connect).not.toHaveBeenCalled();
        });

        test.each([
            0,
            -1,
            1.5,
            "4",
            null
        ])(
            "rejects invalid expectedRevision: %s",
            async (expectedRevision) => {
                await expect(
                    updateDocument({
                        ...validPayload,
                        expectedRevision
                    })
                ).rejects.toMatchObject({
                    statusCode: 400
                });

                expect(pool.connect).not.toHaveBeenCalled();
            }
        );

        test("rejects an update when no title or content is provided", async () => {
            await expect(
                updateDocument({
                    documentId: "123",
                    ownerId: "owner-123",
                    expectedRevision: 4
                })
            ).rejects.toMatchObject({
                statusCode: 400
            });

            expect(pool.connect).not.toHaveBeenCalled();
        });
    });

    // --------------------------------------------------
    // STALE REVISION
    // --------------------------------------------------

    describe("Stale revision handling", () => {
        test("throws 409 when expectedRevision does not match current revision", async () => {
            await expect(
                updateDocument({
                    ...validPayload,
                    expectedRevision: 3
                })
            ).rejects.toMatchObject({
                statusCode: 409
            });

            expect(documentVersionModel.createVersion)
                .not.toHaveBeenCalled();

            expect(documentModel.updateDocument)
                .not.toHaveBeenCalled();

            expect(client.query).toHaveBeenCalledWith("ROLLBACK");
            expect(client.release).toHaveBeenCalledTimes(1);
        });

        test("does not create a snapshot for a stale update", async () => {
            await expect(
                updateDocument({
                    ...validPayload,
                    expectedRevision: 2
                })
            ).rejects.toMatchObject({
                statusCode: 409
            });

            expect(documentVersionModel.getLatestVersionNumber)
                .not.toHaveBeenCalled();

            expect(documentVersionModel.createVersion)
                .not.toHaveBeenCalled();
        });
    });

    // --------------------------------------------------
    // DOCUMENT ACCESS AND PERMISSIONS
    // --------------------------------------------------

    describe("Document access and permissions", () => {
        test("throws 404 when document does not exist", async () => {
            documentModel.findDocumentByIdForUpdate.mockResolvedValue(null);

            await expect(
                updateDocument(validPayload)
            ).rejects.toMatchObject({
                statusCode: 404
            });

            expect(documentModel.updateDocument)
                .not.toHaveBeenCalled();

            expect(client.query).toHaveBeenCalledWith("ROLLBACK");
            expect(client.release).toHaveBeenCalledTimes(1);
        });

        test("throws 404 when user has no document access", async () => {
            documentModel.findDocumentByIdForUpdate.mockResolvedValue({
                ...document,
                owner_id: "different-owner"
            });

            documentShareModel.findDocumentShare.mockResolvedValue(null);

            await expect(
                updateDocument({
                    ...validPayload,
                    ownerId: "unauthorized-user"
                })
            ).rejects.toMatchObject({
                statusCode: 404
            });

            expect(documentModel.updateDocument)
                .not.toHaveBeenCalled();
        });

        test("throws 403 when viewer attempts to update", async () => {
            documentModel.findDocumentByIdForUpdate.mockResolvedValue({
                ...document,
                owner_id: "different-owner"
            });

            documentShareModel.findDocumentShare.mockResolvedValue({
                permission: "viewer"
            });

            await expect(
                updateDocument({
                    ...validPayload,
                    ownerId: "viewer-123"
                })
            ).rejects.toMatchObject({
                statusCode: 403
            });

            expect(documentVersionModel.createVersion)
                .not.toHaveBeenCalled();

            expect(documentModel.updateDocument)
                .not.toHaveBeenCalled();
        });
    });

    // --------------------------------------------------
    // TRANSACTION ROLLBACK
    // --------------------------------------------------

    describe("Transaction rollback", () => {
        test("rolls back when snapshot creation fails", async () => {
            documentVersionModel.createVersion.mockRejectedValue(
                new Error("Snapshot creation failed")
            );

            await expect(
                updateDocument(validPayload)
            ).rejects.toThrow("Snapshot creation failed");

            expect(documentModel.updateDocument)
                .not.toHaveBeenCalled();

            expect(client.query).toHaveBeenCalledWith("ROLLBACK");
            expect(client.release).toHaveBeenCalledTimes(1);
        });

        test("rolls back when document update fails", async () => {
            documentModel.updateDocument.mockRejectedValue(
                new Error("Database update failed")
            );

            await expect(
                updateDocument(validPayload)
            ).rejects.toThrow("Database update failed");

            expect(client.query).toHaveBeenCalledWith("ROLLBACK");
            expect(client.release).toHaveBeenCalledTimes(1);
        });

        test("rolls back when conditional update returns null", async () => {
            documentModel.updateDocument.mockResolvedValue(null);

            await expect(
                updateDocument(validPayload)
            ).rejects.toMatchObject({
                statusCode: 409
            });

            expect(client.query).toHaveBeenCalledWith("ROLLBACK");
            expect(client.release).toHaveBeenCalledTimes(1);
        });

        test("releases database client even when transaction fails", async () => {
            documentModel.findDocumentByIdForUpdate.mockRejectedValue(
                new Error("Database connection error")
            );

            await expect(
                updateDocument(validPayload)
            ).rejects.toThrow("Database connection error");

            expect(client.release).toHaveBeenCalledTimes(1);
        });
    });
});
