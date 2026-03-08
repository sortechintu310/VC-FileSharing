import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    try {
        const token = req.cookies.accessToken;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET
        );

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Access token expired" });
    }
};

