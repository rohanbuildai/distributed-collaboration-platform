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

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await authService.loginUser({
            email,
            password
        });

        return res.status(200).json({
            success: true,
            data: {
                user
            }
        });
    } catch (error) {
        next(error);
    }
};

const getCurrentUser = (req, res) => {
    return res.status(200).json({
        success: true,
        userId: req.user.id
    });
};
module.exports = {
    registerUser ,
    loginUser ,
    getCurrentUser
};