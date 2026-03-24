import bcrypt from "bcrypt";
import db from "../../models/index.js";
import { generateAccessToken, generateRefreshToken } from "../../services/auth.service.js";
import { getAuthCookieOptions } from "../../utils/cookieOptoins.util.js";
import handleResponse from "../../utils/handleResponse.util.js";

const { User } = db;

export async function signup(req, res, next) {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return handleResponse(res, 400, "Full Name, Email & Passord is Required!")
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return handleResponse(res, 400, "Invalid email format")
        }

        if (password.length < 8) {
            return handleResponse(res, 400, "Password must be at least 8 characters")
        }

        const existing = await User.findOne({
            where: { email },
        });

        if (existing) {
            return handleResponse(res, 400, "Email already registered")
        }

        const user = await User.create({
            fullName: fullName,
            email: email,
            password: password,
            isActive: true,
            lastLoginAt: new Date().toISOString()
        })

        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)

        const cookieOptions = getAuthCookieOptions();

        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 3 * 60 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return handleResponse(res, 201, "Signup Successful!", {
            fullName: user?.fullName,
            email: user?.email,
            isActive: user?.isActive,
            lastLoginAt: user?.lastLoginAt
        });

    } catch (err) {
        next(err)
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return handleResponse(res, 400, "Email and Password both are required!");
        }

        const user = await User.findOne({
            where: { email: email.toLowerCase() },
        });

        if (!user || !user.isActive) {
            return handleResponse(res, 401, "Invalid credentials");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return handleResponse(res, 401, "Invalid credentials");
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        const cookieOptions = getAuthCookieOptions();

        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 3 * 60 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return handleResponse(res, 200, "Logged in Successfully!");
    } catch (err) {
        next(err)
    }
}

export async function getMe(req, res, next) {
    try {
        const user = req.user;

        return handleResponse(res, 200, "User fetched successfully", {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt
        });
    } catch (err) {
        next(err);
    }
}