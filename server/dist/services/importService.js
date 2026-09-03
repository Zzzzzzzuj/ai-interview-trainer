"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importQuestions = importQuestions;
const client_1 = require("@prisma/client");
const normalizeQuestion_1 = require("../utils/normalizeQuestion");
const questionService_1 = require("./questionService");
async function importQuestions(items) {
    const summary = { read: items.length, imported: 0, skipped: 0, failed: 0, categories: {} };
    for (const item of items) {
        try {
            const question = (0, normalizeQuestion_1.normalizeQuestion)(item);
            await questionService_1.prisma.question.create({ data: question });
            summary.imported += 1;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                summary.skipped += 1;
            }
            else {
                summary.failed += 1;
                console.error(`Failed to import: ${item.question ?? '(missing question)'}`, error);
            }
        }
    }
    const groups = await questionService_1.prisma.question.groupBy({ by: ['category'], _count: { _all: true } });
    summary.categories = Object.fromEntries(groups.map((group) => [group.category, group._count._all]));
    return summary;
}
