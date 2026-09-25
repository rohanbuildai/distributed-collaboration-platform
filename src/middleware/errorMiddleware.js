const errorMiddleware = (error, req, res, next) => {
    console.error(error);

    const statusCode = error.statusCode || 500;

    const message = error.isOperational
        ? error.message
        : "Internal server error";

    return res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorMiddleware;