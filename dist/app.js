"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const client_1 = require("@prisma/client");
const routes_1 = __importDefault(require("./routes"));
const auth_1 = __importDefault(require("./routes/auth"));
exports.prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use((0, morgan_1.default)('dev'));
// serve uploaded files
app.use('/uploads', express_1.default.static('uploads'));
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1', routes_1.default);
app.get('/health', (_, res) => res.json({ status: 'ok' }));
exports.default = app;
