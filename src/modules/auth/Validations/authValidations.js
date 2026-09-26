const validateRegisterInput = (req, res, next) => {
    let { name, email, password } = req.body;

    const errors = {};

    // Name validation
    if (!name || typeof name !== "string") {
        errors.name = "Name is required";
    } else {
        name = name.trim();

        if (name.length === 0) {
            errors.name = "Name is required";
        } else if (name.length > 100) {
            errors.name = "Name should be less than 100 characters";
        }
    }

    // Email validation
    if (!email || typeof email !== "string") {
        errors.email = "Email is required";
    } else {
        email = email.trim().toLowerCase();

        const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!EMAIL_REGEX.test(email)) {
            errors.email = "Enter a valid email address";
        } else if (email.length > 255) {
            errors.email = "Email should be less than 255 characters";
        }
    }

    // Password validation
    if (!password || typeof password !== "string") {
        errors.password = "Password is required";
    } else {
        if (password.length < 8) {
            errors.password = "Password should be at least 8 characters";
        } else if (password.length > 72) {
            errors.password = "Password should be at most 72 characters";
        }
    }

    // Return validation errors
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }

    // Normalize input
    req.body.name = name;
    req.body.email = email;
    req.body.password = password;

    next();
};

module.exports = {
    validateRegisterInput
};