"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const favorites_1 = require("./routes/favorites");
const practiceRecords_1 = require("./routes/practiceRecords");
const questions_1 = require("./routes/questions");
const questionService_1 = require("./services/questionService");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '1mb' }));
app.get('/health', (_request, response) => response.json({ ok: true }));
app.use('/api/questions', questions_1.questionsRouter);
app.use('/api/practice-records', practiceRecords_1.practiceRecordsRouter);
app.use('/api/favorites', favorites_1.favoritesRouter);
app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ message: 'Internal server error' });
});
const port = Number(process.env.PORT) || 3001;
const server = app.listen(port, () => console.log(`Interview API running at http://localhost:${port}`));
async function shutdown() {
    server.close();
    await questionService_1.prisma.$disconnect();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
