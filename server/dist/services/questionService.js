"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.serializeQuestion = serializeQuestion;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
function parseArray(value) {
    if (!value)
        return [];
    try {
        return JSON.parse(value);
    }
    catch {
        return [];
    }
}
function parseOptions(value) {
    if (!value)
        return undefined;
    try {
        return JSON.parse(value);
    }
    catch {
        return undefined;
    }
}
function serializeQuestion(question) {
    return {
        ...question,
        options: parseOptions(question.options),
        keywords: parseArray(question.keywords),
        commonMissingPoints: parseArray(question.commonMissingPoints),
        followUps: question.followUps ? parseArray(question.followUps) : undefined,
    };
}
