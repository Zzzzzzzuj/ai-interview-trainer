"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoritesRouter = void 0;
const express_1 = require("express");
const questionService_1 = require("../services/questionService");
exports.favoritesRouter = (0, express_1.Router)();
exports.favoritesRouter.post('/:questionId', async (request, response, next) => {
    try {
        const question = await questionService_1.prisma.question.findUnique({ where: { id: request.params.questionId } });
        if (!question)
            return response.status(404).json({ message: 'Question not found' });
        const favorite = await questionService_1.prisma.favoriteQuestion.upsert({ where: { questionId: question.id }, update: {}, create: { questionId: question.id } });
        response.status(201).json(favorite);
    }
    catch (error) {
        next(error);
    }
});
exports.favoritesRouter.delete('/:questionId', async (request, response, next) => {
    try {
        await questionService_1.prisma.favoriteQuestion.deleteMany({ where: { questionId: request.params.questionId } });
        response.status(204).end();
    }
    catch (error) {
        next(error);
    }
});
exports.favoritesRouter.get('/', async (_request, response, next) => {
    try {
        const favorites = await questionService_1.prisma.favoriteQuestion.findMany({ orderBy: { createdAt: 'desc' } });
        const ids = favorites.map((favorite) => favorite.questionId);
        const questions = await questionService_1.prisma.question.findMany({ where: { id: { in: ids } } });
        response.json(questions.map(questionService_1.serializeQuestion));
    }
    catch (error) {
        next(error);
    }
});
