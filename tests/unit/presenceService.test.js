
const presenceService = require(
    "../../src/modules/collaboration/Services/presenceService"
);

describe("Presence Service", () => {
    let documentId;
    let userId;

    let documentCounter = 0;

    beforeEach(() => {
        documentCounter++;

        documentId = `presence-test-${documentCounter}`;
        userId = "101";
    });

    describe("addSocketToDocument", () => {
        test("should add a user's first socket connection", () => {
            const result = presenceService.addSocketToDocument({
                documentId,
                userId,
                socketId: "socket-A"
            });

            expect(result.isFirstConnection).toBe(true);
            expect(result.users).toEqual([userId]);
        });

        test("should support multiple sockets for the same user", () => {
            presenceService.addSocketToDocument({
                documentId,
                userId,
                socketId: "socket-A"
            });

            const result = presenceService.addSocketToDocument({
                documentId,
                userId,
                socketId: "socket-B"
            });

            expect(result.isFirstConnection).toBe(false);
            expect(result.users).toEqual([userId]);
        });

        test("should not count the same socket twice", () => {
            presenceService.addSocketToDocument({
                documentId,
                userId,
                socketId: "socket-A"
            });

            const result = presenceService.addSocketToDocument({
                documentId,
                userId,
                socketId: "socket-A"
            });

            expect(result.isFirstConnection).toBe(false);
            expect(result.users).toEqual([userId]);
        });
    });

    describe("removeSocketFromDocument", () => {
        test("should not mark user offline when another socket remains", () => {
            presenceService.addSocketToDocument({
                documentId,
                userId,
                socketId: "socket-A"
            });

            presenceService.addSocketToDocument({
                documentId,
                userId,
                socketId: "socket-B"
            });

            const result = presenceService.removeSocketFromDocument({
                documentId,
                userId,
                socketId: "socket-A"
            });

            expect(result.wasRemoved).toBe(true);
            expect(result.isLastConnection).toBe(false);

            expect(
                presenceService.getDocumentPresence(documentId)
            ).toEqual([userId]);
        });

        test("should mark user offline after the final socket disconnects", () => {
            presenceService.addSocketToDocument({
                documentId,
                userId,
                socketId: "socket-A"
            });

            const result = presenceService.removeSocketFromDocument({
                documentId,
                userId,
                socketId: "socket-A"
            });

            expect(result.wasRemoved).toBe(true);
            expect(result.isLastConnection).toBe(true);

            expect(
                presenceService.getDocumentPresence(documentId)
            ).toEqual([]);
        });

        test("should not affect presence when removing an unknown socket", () => {
            presenceService.addSocketToDocument({
                documentId,
                userId,
                socketId: "socket-A"
            });

            const result = presenceService.removeSocketFromDocument({
                documentId,
                userId,
                socketId: "unknown-socket"
            });

            expect(result.wasRemoved).toBe(false);
            expect(result.isLastConnection).toBe(false);

            expect(
                presenceService.getDocumentPresence(documentId)
            ).toEqual([userId]);
        });
    });

    describe("getDocumentPresence", () => {
        test("should track multiple users independently in the same document", () => {
            presenceService.addSocketToDocument({
                documentId,
                userId: "101",
                socketId: "socket-A"
            });

            presenceService.addSocketToDocument({
                documentId,
                userId: "102",
                socketId: "socket-B"
            });

            expect(
                presenceService.getDocumentPresence(documentId)
            ).toEqual(["101", "102"]);
        });

        test("should maintain separate presence for different documents", () => {
            const anotherDocumentId = `${documentId}-another`;

            presenceService.addSocketToDocument({
                documentId,
                userId: "101",
                socketId: "socket-A"
            });

            presenceService.addSocketToDocument({
                documentId: anotherDocumentId,
                userId: "102",
                socketId: "socket-B"
            });

            expect(
                presenceService.getDocumentPresence(documentId)
            ).toEqual(["101"]);

            expect(
                presenceService.getDocumentPresence(anotherDocumentId)
            ).toEqual(["102"]);
        });
    });
});
