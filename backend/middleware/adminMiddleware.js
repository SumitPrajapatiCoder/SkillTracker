const userModel = require("../models/userModel");

const adminMiddleware = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.userId);

        if (!user || !user.isAdmin) {
            return res.status(403).send({
                success: false,
                message: "Access denied: Admins only"
            });
        }

        next();
    } catch (error) {
        console.error("Admin Middleware Error:", error);
        res.status(500).send({
            success: false,
            message: "Internal Server Error"
        });
    }
};

module.exports = adminMiddleware;
