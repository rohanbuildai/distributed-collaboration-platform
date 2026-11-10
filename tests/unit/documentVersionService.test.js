
jest.mock("../../src/modules/documentVersions/Models/documentVersionModel");
jest.mock("../../src/modules/documents/Models/documentModel");
jest.mock("../../src/modules/documentShares/Models/documentShareModel");
jest.mock("../../src/config/database", () => ({
    connect: jest.fn()
}));

const documentVersionModel = require("../../src/modules/documentVersions/Models/documentVersionModel");
const documentModel = require("../../src/modules/documents/Models/documentModel");
const documentShareModel = require("../../src/modules/documentShares/Models/documentShareModel");
const pool = require("../../src/config/database");

const {
    getDocumentVersions,
    getDocumentVersion,
    restoreDocumentVersion
} = require("../../src/modules/documentVersions/Services/documentVersionService");

describe("getDocumentVersions", () => {
    const input = {
        documentId: "10",
        userId: "1",
        limit: 10,
    };

    const document = {
        id: "10",
        owner_id: "1",
        title: "Test document",
    };

    const versions = [
        {
            id: "3",
            document_id: "10",
            version_number: 3,
            title: "Version 3",
        },
        {
            id: "2",
            document_id: "10",
            version_number: 2,
            title: "Version 2",
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        documentModel.findDocumentById.mockResolvedValue(document);

        documentVersionModel.getVersions.mockResolvedValue(versions);
    });

    test("returns version history for the document owner", async () => {
        const result = await getDocumentVersions(input);

        expect(result.versions).toEqual(versions);

        expect(result.pagination).toEqual({
            limit: 10,
            hasNextPage: false,
            nextCursor: null,
        });

        expect(documentModel.findDocumentById).toHaveBeenCalledWith({
            documentId: "10",
        });

        expect(documentShareModel.findDocumentShare).not.toHaveBeenCalled();

        expect(documentVersionModel.getVersions).toHaveBeenCalledWith({
            documentId: "10",
            limit: 11,
            cursor: null,
        });
    });

    test("returns version history for an editor", async () => {
        documentShareModel.findDocumentShare.mockResolvedValue({
            document_id: "10",
            shared_with_user_id: "2",
            permission: "editor",
        });

        const result = await getDocumentVersions({
            ...input,
            userId: "2",
        });

        expect(result.versions).toEqual(versions);

        expect(documentShareModel.findDocumentShare).toHaveBeenCalledWith({
            documentId: "10",
            sharedWithUserId: "2",
        });

        expect(documentVersionModel.getVersions).toHaveBeenCalled();
    });

    test("returns version history for a viewer", async () => {
        documentShareModel.findDocumentShare.mockResolvedValue({
            document_id: "10",
            shared_with_user_id: "3",
            permission: "viewer",
        });

        const result = await getDocumentVersions({
            ...input,
            userId: "3",
        });

        expect(result.versions).toEqual(versions);

        expect(documentShareModel.findDocumentShare).toHaveBeenCalled();

        expect(documentVersionModel.getVersions).toHaveBeenCalled();
    });

    test("rejects when document does not exist", async () => {
        documentModel.findDocumentById.mockResolvedValue(null);

        await expect(
            getDocumentVersions(input)
        ).rejects.toMatchObject({
            statusCode: 404,
        });

        expect(documentVersionModel.getVersions).not.toHaveBeenCalled();
    });

    test("rejects when user has no access to the document", async () => {
        documentShareModel.findDocumentShare.mockResolvedValue(null);

        await expect(
            getDocumentVersions({
                ...input,
                userId: "99",
            })
        ).rejects.toMatchObject({
            statusCode: 404,
        });

        expect(documentVersionModel.getVersions).not.toHaveBeenCalled();
    });

    test("rejects an invalid document ID", async () => {
        await expect(
            getDocumentVersions({
                ...input,
                documentId: "invalid",
            })
        ).rejects.toMatchObject({
            statusCode: 400,
        });

        expect(documentModel.findDocumentById).not.toHaveBeenCalled();
    });

    test("rejects an invalid pagination limit", async () => {
        await expect(
            getDocumentVersions({
                ...input,
                limit: 0,
            })
        ).rejects.toMatchObject({
            statusCode: 400,
        });

        expect(documentVersionModel.getVersions).not.toHaveBeenCalled();
    });

    test("returns pagination cursor when another page exists", async () => {
        const paginatedVersions = [
            { id: "3", version_number: 3 },
            { id: "2", version_number: 2 },
            { id: "1", version_number: 1 },
        ];

        documentVersionModel.getVersions.mockResolvedValue(
            paginatedVersions
        );

        const result = await getDocumentVersions({
            ...input,
            limit: 2,
        });

        expect(result.versions).toHaveLength(2);

        expect(result.pagination).toEqual({
            limit: 2,
            hasNextPage: true,
            nextCursor: 2,
        });

        expect(documentVersionModel.getVersions).toHaveBeenCalledWith({
            documentId: "10",
            limit: 3,
            cursor: null,
        });
    });

    test("passes cursor to the version model", async () => {
        await getDocumentVersions({
            ...input,
            cursor: 5,
        });

        expect(documentVersionModel.getVersions).toHaveBeenCalledWith({
            documentId: "10",
            limit: 11,
            cursor: 5,
        });
    });

    test("rethrows unexpected database errors", async () => {
        const databaseError = new Error("Database unavailable");

        documentVersionModel.getVersions.mockRejectedValue(databaseError);

        await expect(
            getDocumentVersions(input)
        ).rejects.toBe(databaseError);
    });
});

describe("getDocumentVersion", () => {
    const input = {
        documentId: "10",
        versionId: "5",
        userId: "1",
    };

    const document = {
        id: "10",
        owner_id: "1",
        title: "Test document",
    };

    const version = {
        id: "5",
        document_id: "10",
        version_number: 2,
        title: "Previous title",
        content: {
            type: "doc",
            content: [],
        },
        edited_by: "1",
    };

    beforeEach(() => {
        jest.clearAllMocks();

        documentModel.findDocumentById.mockResolvedValue(document);

        documentVersionModel.getVersionById.mockResolvedValue(version);
    });

    test("returns a specific version for the document owner", async () => {
        const result = await getDocumentVersion(input);

        expect(result).toEqual(version);

        expect(documentVersionModel.getVersionById).toHaveBeenCalledWith({
            documentId: "10",
            versionId: "5",
        });

        expect(documentShareModel.findDocumentShare).not.toHaveBeenCalled();
    });

    test("returns a specific version for a shared user", async () => {
        documentShareModel.findDocumentShare.mockResolvedValue({
            document_id: "10",
            shared_with_user_id: "2",
            permission: "viewer",
        });

        const result = await getDocumentVersion({
            ...input,
            userId: "2",
        });

        expect(result).toEqual(version);

        expect(documentVersionModel.getVersionById).toHaveBeenCalled();
    });

    test("rejects when document does not exist", async () => {
        documentModel.findDocumentById.mockResolvedValue(null);

        await expect(
            getDocumentVersion(input)
        ).rejects.toMatchObject({
            statusCode: 404,
        });

        expect(documentVersionModel.getVersionById).not.toHaveBeenCalled();
    });

    test("rejects when user has no access to the document", async () => {
        documentShareModel.findDocumentShare.mockResolvedValue(null);

        await expect(
            getDocumentVersion({
                ...input,
                userId: "99",
            })
        ).rejects.toMatchObject({
            statusCode: 404,
        });

        expect(documentVersionModel.getVersionById).not.toHaveBeenCalled();
    });

    test("rejects when the requested version does not exist", async () => {
        documentVersionModel.getVersionById.mockResolvedValue(null);

        await expect(
            getDocumentVersion(input)
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Document version not found",
        });
    });

    test("rejects an invalid document ID", async () => {
        await expect(
            getDocumentVersion({
                ...input,
                documentId: "invalid",
            })
        ).rejects.toMatchObject({
            statusCode: 400,
        });

        expect(documentModel.findDocumentById).not.toHaveBeenCalled();
    });

    test("rejects an invalid version ID", async () => {
        await expect(
            getDocumentVersion({
                ...input,
                versionId: "invalid",
            })
        ).rejects.toMatchObject({
            statusCode: 400,
        });

        expect(documentVersionModel.getVersionById).not.toHaveBeenCalled();
    });

    test("rethrows unexpected database errors", async () => {
        const databaseError = new Error("Database unavailable");

        documentVersionModel.getVersionById.mockRejectedValue(databaseError);

        await expect(
            getDocumentVersion(input)
        ).rejects.toBe(databaseError);
    });


describe("restoreDocumentVersion", () => {
    let client;

    const input = {
        documentId: "10",
        versionId: "5",
        userId: "1"
    };

    const document = {
        id: "10",
        owner_id: "1",
        title: "Current document",
        content: {
            type: "doc",
            content: []
        }
    };

    const targetVersion = {
        id: "5",
        document_id: "10",
        version_number: 1,
        title: "Previous document",
        content: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Previous content"
                        }
                    ]
                }
            ]
        }
    };

    const restoredDocument = {
        ...document,
        title: targetVersion.title,
        content: targetVersion.content
    };

    beforeEach(() => {
        jest.clearAllMocks();

        client = {
            query: jest.fn().mockResolvedValue({ rows: [] }),
            release: jest.fn()
        };

        pool.connect.mockResolvedValue(client);

        documentModel.findDocumentByIdForUpdate.mockResolvedValue(document);

        documentVersionModel.getVersionById.mockResolvedValue(targetVersion);

        documentVersionModel.getLatestVersionNumber.mockResolvedValue(3);

        documentVersionModel.createVersion.mockResolvedValue({
            id: "20",
            version_number: 4
        });

        documentModel.updateDocument.mockResolvedValue(restoredDocument);

        documentShareModel.findDocumentShare.mockResolvedValue(null);
    });

    test("allows the owner to restore a previous version", async () => {
        const result = await restoreDocumentVersion(input);

        expect(result.document).toEqual(restoredDocument);
        expect(result.restoredFromVersion).toBe(1);
        expect(result.newVersionNumber).toBe(4);

        expect(documentVersionModel.createVersion).toHaveBeenCalledWith(
            expect.objectContaining({
                documentId: "10",
                versionNumber: 4,
                title: "Current document",
                content: document.content,
                editedBy: "1",
                client
            })
        );

        expect(documentModel.updateDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                documentId: "10",
                title: targetVersion.title,
                content: targetVersion.content,
                client
            })
        );

        expect(client.query).toHaveBeenCalledWith("BEGIN");
        expect(client.query).toHaveBeenCalledWith("COMMIT");
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    test("allows an editor to restore a previous version", async () => {
        documentShareModel.findDocumentShare.mockResolvedValue({
            document_id: "10",
            shared_with_user_id: "2",
            permission: "editor"
        });

        const result = await restoreDocumentVersion({
            ...input,
            userId: "2"
        });

        expect(result.restoredFromVersion).toBe(1);

        expect(documentShareModel.findDocumentShare).toHaveBeenCalledWith({
            documentId: "10",
            sharedWithUserId: "2",
            client
        });

        expect(documentVersionModel.createVersion).toHaveBeenCalled();
        expect(documentModel.updateDocument).toHaveBeenCalled();
    });

    test("does not allow a viewer to restore a document", async () => {
        documentShareModel.findDocumentShare.mockResolvedValue({
            document_id: "10",
            shared_with_user_id: "2",
            permission: "viewer"
        });

        await expect(
            restoreDocumentVersion({
                ...input,
                userId: "2"
            })
        ).rejects.toMatchObject({
            statusCode: 403
        });

        expect(documentVersionModel.createVersion).not.toHaveBeenCalled();
        expect(documentModel.updateDocument).not.toHaveBeenCalled();
    });

    test("rejects when the document does not exist", async () => {
        documentModel.findDocumentByIdForUpdate.mockResolvedValue(null);

        await expect(
            restoreDocumentVersion(input)
        ).rejects.toMatchObject({
            statusCode: 404
        });

        expect(documentVersionModel.getVersionById).not.toHaveBeenCalled();
        expect(documentVersionModel.createVersion).not.toHaveBeenCalled();
    });

    test("rejects when the user has no access to the document", async () => {
        await expect(
            restoreDocumentVersion({
                ...input,
                userId: "99"
            })
        ).rejects.toMatchObject({
            statusCode: 404
        });

        expect(documentVersionModel.createVersion).not.toHaveBeenCalled();
        expect(documentModel.updateDocument).not.toHaveBeenCalled();
    });

    test("rejects when the target version does not exist", async () => {
        documentVersionModel.getVersionById.mockResolvedValue(null);

        await expect(
            restoreDocumentVersion(input)
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Document version not found"
        });

        expect(documentVersionModel.createVersion).not.toHaveBeenCalled();
        expect(documentModel.updateDocument).not.toHaveBeenCalled();
    });

    test("rejects an invalid document ID", async () => {
        await expect(
            restoreDocumentVersion({
                ...input,
                documentId: "invalid"
            })
        ).rejects.toMatchObject({
            statusCode: 400
        });

        expect(pool.connect).not.toHaveBeenCalled();
    });

    test("rejects an invalid version ID", async () => {
        await expect(
            restoreDocumentVersion({
                ...input,
                versionId: "invalid"
            })
        ).rejects.toMatchObject({
            statusCode: 400
        });

        expect(pool.connect).not.toHaveBeenCalled();
    });

    test("rolls back the transaction when snapshot creation fails", async () => {
        const databaseError = new Error("Snapshot creation failed");

        documentVersionModel.createVersion.mockRejectedValue(databaseError);

        await expect(
            restoreDocumentVersion(input)
        ).rejects.toBe(databaseError);

        expect(client.query).toHaveBeenCalledWith("BEGIN");
        expect(client.query).toHaveBeenCalledWith("ROLLBACK");

        expect(documentModel.updateDocument).not.toHaveBeenCalled();
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    test("rolls back the transaction when document restoration fails", async () => {
        const databaseError = new Error("Document update failed");

        documentModel.updateDocument.mockRejectedValue(databaseError);

        await expect(
            restoreDocumentVersion(input)
        ).rejects.toBe(databaseError);

        expect(documentVersionModel.createVersion).toHaveBeenCalled();
        expect(client.query).toHaveBeenCalledWith("ROLLBACK");
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    test("releases the database client when the transaction succeeds", async () => {
        await restoreDocumentVersion(input);

        expect(client.release).toHaveBeenCalledTimes(1);
    });

    test("releases the database client when the transaction fails", async () => {
        documentVersionModel.getVersionById.mockRejectedValue(
            new Error("Database unavailable")
        );

        await expect(
            restoreDocumentVersion(input)
        ).rejects.toThrow("Database unavailable");

        expect(client.query).toHaveBeenCalledWith("ROLLBACK");
        expect(client.release).toHaveBeenCalledTimes(1);
    });
});

});
