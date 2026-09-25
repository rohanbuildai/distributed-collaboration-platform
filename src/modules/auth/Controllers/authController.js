const authService = require("../Services/authService");

const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        const user = await authService.registerUser({
            name,
            email,
            password
        });

        return res.status(201).json({
            success: true,
            data: {
                user
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUser
};