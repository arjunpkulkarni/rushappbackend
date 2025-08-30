"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    profileImage: true,
                    campusId: true,
                    campus: true,
                },
            });
            next();
        }
        catch (error) {
            console.error(error);
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};
exports.protect = protect;
