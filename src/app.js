
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");

const mainRoute = require("./Routes/mainRoute/centralizedRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(helmet());
app.use(cors({
    origin: "http://localhost:3001",
    credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
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
