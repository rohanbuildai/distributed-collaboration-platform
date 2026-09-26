const authService = require("../Services/authService");

const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

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