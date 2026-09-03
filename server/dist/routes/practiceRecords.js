"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.practiceRecordsRouter = void 0;
const express_1 = require("express");
const questionService_1 = require("../services/questionService");
exports.practiceRecordsRouter = (0, express_1.Router)();
exports.practiceRecordsRouter.post('/', async (request, response, next) => {
    try {
        const body = request.body ?? {};
        if (!body.questionId || !body.category || !body.type)
            return response.status(400).json({ message: 'questionId, category and type are required' });
        const record = await questionService_1.prisma.practiceRecord.create({ data: {
                questionId: String(body.questionId), category: String(body.category), type: String(body.type),
                isCorrect: typeof body.isCorrect === 'boolean' ? body.isCorrect : null,
                selectedOption: typeof body.selectedOption === 'string' ? body.selectedOption : null,
                userAnswer: typeof body.userAnswer === 'string' ? body.userAnswer : null,
                reviewResult: body.reviewResult ? JSON.stringify(body.reviewResult) : null,
            } });
        response.status(201).json(record);
    }
    catch (error) {
        next(error);
    }
});
exports.practiceRecordsRouter.get('/', async (_request, response, next) => {
    try {
        response.json(await questionService_1.prisma.practiceRecord.findMany({ orderBy: { createdAt: 'desc' } }));
    }
    catch (error) {
        next(error);
    }
});
