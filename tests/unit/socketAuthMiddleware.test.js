
const jwt = require("jsonwebtoken");

const socketAuthMiddleware = require(
    "../../src/modules/collaboration/Middleware/socketAuthMiddleware"
);

describe("Socket Authentication Middleware", () => {
    const secret = process.env.JWT_ACCESS_SECRET;

    const createSocket = (auth = {}, headers = {}) => ({
        handshake: {
            auth,
            headers
        },
        data: {}
    });

    const createToken = (payload, options = {}) => {
        const secret = process.env.JWT_ACCESS_SECRET;

        if (!secret) {
            throw new Error("JWT_ACCESS_SECRET is missing from test environment");
        }

        return jwt.sign(payload, secret, options);
    };

    beforeAll(() => {
        if (!secret) {
            throw new Error("JWT_ACCESS_SECRET is missing from .env.test");
        }
    });

    test("should authenticate using a valid handshake token", () => {
        const token = createToken({
            sub: "123",
            type: "access"
        });

        const socket = createSocket({ token });
        const next = jest.fn();

        socketAuthMiddleware(socket, next);

        expect(next).toHaveBeenCalledWith();
        expect(socket.user).toEqual({ id: "123" });
    });

    test("should authenticate using the accessToken cookie", () => {
        const token = createToken({
            sub: "123",
            type: "access"
        });

        const socket = createSocket(
            {},
            { cookie: `accessToken=${token}` }
        );

        const next = jest.fn();

        socketAuthMiddleware(socket, next);

        expect(next).toHaveBeenCalledWith();
        expect(socket.user).toEqual({ id: "123" });
    });

    test("should reject a connection without a token", () => {
        const socket = createSocket();
        const next = jest.fn();

        socketAuthMiddleware(socket, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Authentication required"
            })
        );
    });

    test("should reject an invalid token", () => {
        const socket = createSocket({
            token: "invalid-token"
        });

        const next = jest.fn();

        socketAuthMiddleware(socket, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Invalid or expired access token"
            })
        );
    });

    test("should reject an expired token", () => {
        const token = createToken(
            {
                sub: "123",
                type: "access"
            },
            { expiresIn: -1 }
        );

        const socket = createSocket({ token });
        const next = jest.fn();

        socketAuthMiddleware(socket, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Invalid or expired access token"
            })
        );
    });

    test("should reject a refresh token", () => {
        const token = createToken({
            sub: "123",
            type: "refresh"
        });

        const socket = createSocket({ token });
        const next = jest.fn();

        socketAuthMiddleware(socket, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Invalid access token"
            })
        );
    });

    test("should reject a token without a subject", () => {
        const token = createToken({
            type: "access"
        });

        const socket = createSocket({ token });
        const next = jest.fn();

        socketAuthMiddleware(socket, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Invalid access token"
            })
        );
    });
});
