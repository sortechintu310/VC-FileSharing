import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import db from "../models/index.js";

const {User} = db;

dotenv.config();

export const verifyRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        const user = await User.findByPk(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
};


export const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, name: user.fullName, email: user.email },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
    );
};

export const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES }
    );
};