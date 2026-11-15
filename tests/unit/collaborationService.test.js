
const documentService = require(
    "../../src/modules/documents/Services/documentService"
);

const documentShareModel = require(
    "../../src/modules/documentShares/Models/documentShareModel"
);

const {
    getDocumentAccess
} = require(
    "../../src/modules/collaboration/Services/collaborationService"
);

jest.mock(
    "../../src/modules/documents/Services/documentService",
    () => ({
        getDocument: jest.fn()
    })
);

jest.mock(
    "../../src/modules/documentShares/Models/documentShareModel",
    () => ({
        findDocumentShare: jest.fn()
    })
);

describe("Collaboration Service - Document Access", () => {
    const document = {
        id: "123",
        owner_id: "owner-123",
        title: "Test Document",
        revision: 1
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should grant owner access", async () => {
        documentService.getDocument.mockResolvedValue(document);

        const result = await getDocumentAccess({
            documentId: "123",
            userId: "owner-123"
        });

        expect(result.permission).toBe("owner");

        expect(documentShareModel.findDocumentShare)
            .not.toHaveBeenCalled();
    });

    test("should grant editor access", async () => {
        documentService.getDocument.mockResolvedValue(document);

        documentShareModel.findDocumentShare.mockResolvedValue({
            permission: "editor"
        });

        const result = await getDocumentAccess({
            documentId: "123",
            userId: "editor-123"
        });

        expect(result.permission).toBe("editor");
    });

    test("should grant viewer access", async () => {
        documentService.getDocument.mockResolvedValue(document);

        documentShareModel.findDocumentShare.mockResolvedValue({
            permission: "viewer"
        });

        const result = await getDocumentAccess({
            documentId: "123",
            userId: "viewer-123"
        });

        expect(result.permission).toBe("viewer");
    });

    test("should reject a user without sharing permission", async () => {
        documentService.getDocument.mockResolvedValue(document);

        documentShareModel.findDocumentShare.mockResolvedValue(null);

        await expect(
            getDocumentAccess({
                documentId: "123",
                userId: "unauthorized-user"
            })
        ).rejects.toMatchObject({
            statusCode: 404
        });
    });

    test("should propagate document not found errors", async () => {
        documentService.getDocument.mockRejectedValue({
            message: "Document not found",
            statusCode: 404
        });

        await expect(
            getDocumentAccess({
                documentId: "999",
                userId: "owner-123"
            })
        ).rejects.toMatchObject({
            statusCode: 404
        });

        expect(documentShareModel.findDocumentShare)
            .not.toHaveBeenCalled();
    });
});
