
jest.mock("../../src/modules/documentShares/Models/documentShareModel");
jest.mock("../../src/modules/documents/Models/documentModel");
jest.mock("../../src/modules/auth/Models/authModel");

const documentShareModel = require("../../src/modules/documentShares/Models/documentShareModel");
const documentModel = require("../../src/modules/documents/Models/documentModel");
const authModel = require("../../src/modules/auth/Models/authModel");

const {
    createDocumentShare ,
    revokeDocumentShare
} = require("../../src/modules/documentShares/Services/documentShareService");

describe("createDocumentShare", () => {
    const input = {
        documentId: "10",
        ownerId: "1",
        sharedWithUserId: "2",
        permission: "viewer"
    };

    beforeEach(() => {
        jest.clearAllMocks();

        authModel.findUserById.mockResolvedValue({
            id: "2",
            email: "recipient@example.com"
        });

        documentModel.findDocumentByIdAndOwner.mockResolvedValue({
            id: "10",
            owner_id: "1",
            title: "Test document"
        });

        documentShareModel.createDocumentShare.mockResolvedValue({
            id: "5",
            document_id: "10",
            shared_with_user_id: "2",
            permission: "viewer"
        });
    });

    test("creates a share for a valid recipient and document owner", async () => {
        const result = await createDocumentShare(input);

        expect(result).toEqual({
            id: "5",
            document_id: "10",
            shared_with_user_id: "2",
            permission: "viewer"
        });

        expect(documentShareModel.createDocumentShare).toHaveBeenCalledWith({
            documentId: "10",
            sharedWithUserId: "2",
            permission: "viewer"
        });
    });

    test("rejects an invalid permission", async () => {
        await expect(
            createDocumentShare({
                ...input,
                permission: "admin"
            })
        ).rejects.toMatchObject({
            statusCode: 400
        });

        expect(documentShareModel.createDocumentShare).not.toHaveBeenCalled();
    });

    test("rejects a recipient who does not exist", async () => {
        authModel.findUserById.mockResolvedValue(null);

        await expect(
            createDocumentShare(input)
        ).rejects.toMatchObject({
            statusCode: 404
        });

        expect(documentShareModel.createDocumentShare).not.toHaveBeenCalled();
    });

    test("rejects when the requester does not own the document", async () => {
        documentModel.findDocumentByIdAndOwner.mockResolvedValue(null);

        await expect(
            createDocumentShare(input)
        ).rejects.toMatchObject({
            statusCode: 404
        });

        expect(documentShareModel.createDocumentShare).not.toHaveBeenCalled();
    });

    test("rejects sharing a document with its own owner", async () => {
        await expect(
            createDocumentShare({
                ...input,
                sharedWithUserId: "1"
            })
        ).rejects.toMatchObject({
            statusCode: 400
        });

        expect(documentShareModel.createDocumentShare).not.toHaveBeenCalled();
    });

    test("converts duplicate share errors into HTTP 409", async () => {
        const duplicateError = new Error("Unique constraint violation");
        duplicateError.code = "23505";

        documentShareModel.createDocumentShare.mockRejectedValue(duplicateError);

        await expect(
            createDocumentShare(input)
        ).rejects.toMatchObject({
            statusCode: 409,
            message: "Document already shared with this user"
        });
    });

    test("rethrows unexpected database errors", async () => {
        const databaseError = new Error("Database unavailable");

        documentShareModel.createDocumentShare.mockRejectedValue(databaseError);

        await expect(
            createDocumentShare(input)
        ).rejects.toBe(databaseError);
    });
});

describe("revokeDocumentShare", () => {
    const input = {
        documentId: "10",
        ownerId: "1",
        sharedWithUserId: "2"
    };

    beforeEach(() => {
        jest.clearAllMocks();

        documentModel.findDocumentByIdAndOwner.mockResolvedValue({
            id: "10",
            owner_id: "1",
            title: "Test document"
        });

        documentShareModel.deleteDocumentShare.mockResolvedValue({
            id: "5",
            document_id: "10",
            shared_with_user_id: "2",
            permission: "viewer"
        });
    });

    test("revokes document sharing successfully", async () => {
        const result = await revokeDocumentShare(input);

        expect(result).toEqual({
            id: "5",
            document_id: "10",
            shared_with_user_id: "2",
            permission: "viewer"
        });

        expect(documentModel.findDocumentByIdAndOwner).toHaveBeenCalledWith({
            documentId: "10",
            ownerId: "1"
        });

        expect(documentShareModel.deleteDocumentShare).toHaveBeenCalledWith({
            documentId: "10",
            sharedWithUserId: "2"
        });
    });

    test("rejects when requester does not own the document", async () => {
        documentModel.findDocumentByIdAndOwner.mockResolvedValue(null);

        await expect(
            revokeDocumentShare(input)
        ).rejects.toMatchObject({
            statusCode: 404
        });

        expect(documentShareModel.deleteDocumentShare).not.toHaveBeenCalled();
    });

    test("rejects when document share does not exist", async () => {
        documentShareModel.deleteDocumentShare.mockResolvedValue(null);

        await expect(
            revokeDocumentShare(input)
        ).rejects.toMatchObject({
            statusCode: 404
        });

        expect(documentShareModel.deleteDocumentShare).toHaveBeenCalled();
    });

    test("rethrows unexpected database errors", async () => {
        const databaseError = new Error("Database unavailable");

        documentShareModel.deleteDocumentShare.mockRejectedValue(databaseError);

        await expect(
            revokeDocumentShare(input)
        ).rejects.toBe(databaseError);
    });
});
