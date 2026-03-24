import jwt from "jsonwebtoken";
import db from "../models/index.js";

const { User } = db;

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        const user = await User.findByPk(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};