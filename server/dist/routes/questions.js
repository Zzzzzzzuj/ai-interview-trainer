"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionsRouter = void 0;
const express_1 = require("express");
const questionService_1 = require("../services/questionService");
exports.questionsRouter = (0, express_1.Router)();
exports.questionsRouter.get('/categories', async (_request, response, next) => {
    try {
        const groups = await questionService_1.prisma.question.groupBy({ by: ['category'], _count: { _all: true }, orderBy: { category: 'asc' } });
        response.json(groups.map((group) => ({ category: group.category, count: group._count._all })));
    }
    catch (error) {
        next(error);
    }
});
exports.questionsRouter.get('/', async (request, response, next) => {
    try {
        const page = Math.max(1, Number(request.query.page) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(request.query.pageSize) || 50));
        const category = typeof request.query.category === 'string' ? request.query.category : undefined;
        const type = typeof request.query.type === 'string' ? request.query.type : undefined;
        const difficulty = typeof request.query.difficulty === 'string' ? request.query.difficulty : undefined;
        const keyword = typeof request.query.keyword === 'string' ? request.query.keyword.trim() : '';
        const where = {
            ...(category ? { category } : {}), ...(type ? { type } : {}), ...(difficulty ? { difficulty } : {}),
            ...(keyword ? { OR: [{ question: { contains: keyword } }, { keywords: { contains: keyword } }] } : {}),
        };
        const [items, total] = await questionService_1.prisma.$transaction([
            questionService_1.prisma.question.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' } }),
            questionService_1.prisma.question.count({ where }),
        ]);
        response.json({ items: items.map(questionService_1.serializeQuestion), total, page, pageSize });
    }
    catch (error) {
        next(error);
    }
});
exports.questionsRouter.get('/:id', async (request, response, next) => {
    try {
        const question = await questionService_1.prisma.question.findUnique({ where: { id: request.params.id } });
        if (!question)
            return response.status(404).json({ message: 'Question not found' });
        response.json((0, questionService_1.serializeQuestion)(question));
    }
    catch (error) {
        next(error);
    }
});
