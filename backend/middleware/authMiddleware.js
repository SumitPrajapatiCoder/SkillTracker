const JWT = require("jsonwebtoken");
const userModel = require("../models/userModel");

module.exports = async (req, res, next) => {
    try {
        const token = req.headers['authorization']?.split(" ")[1];

        if (!token) {
            return res.status(401).send({ message: "Auth Failed: No token provided", success: false });
        }

        JWT.verify(token, process.env.JWT_SECRET, async (err, decode) => {
            if (err) {
                return res.status(401).send({ message: "Auth Failed: Invalid token", success: false });
            }

            const user = await userModel.findById(decode.id);

            if (!user) {
                return res.status(404).send({ message: "User not found", success: false });
            }

            if (user.isBlocked) {
                return res.status(403).send({
                    message: "User is blocked by admin",
                    success: false,
                });
            }

            req.body = req.body || {};
            req.body.userId = decode.id;
            req.userId = decode.id;
            req.user = user; 
            
            next();
        });
    } catch (error) {
        console.log("Middleware error:", error);
        res.status(500).send({ message: "Internal Server Error", success: false });
    }
};
