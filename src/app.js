
const express = require("express");
const cookieParser = require("cookie-parser");

const mainRoute = require("../Routes/mainRoute/centralizedRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Collaboration platform is running"
    });
});

app.use("/api/v1", mainRoute);
app.use(errorMiddleware);

module.exports = app;
