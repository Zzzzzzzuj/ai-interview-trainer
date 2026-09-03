"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeQuestion = normalizeQuestion;
const validTypes = new Set(['choice', 'short_answer']);
const validDifficulties = new Set(['easy', 'medium', 'hard']);
function stringArray(value) {
    if (Array.isArray(value))
        return value.map(String).map((item) => item.trim()).filter(Boolean);
    if (typeof value !== 'string')
        return [];
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed))
            return parsed.map(String).map((item) => item.trim()).filter(Boolean);
    }
    catch {
        // Plain comma-separated input is convenient for hand-authored import files.
    }
    return value.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean);
}
function normalizeOptions(value) {
    if (!Array.isArray(value) || value.length === 0)
        return null;
    return JSON.stringify(value.map((item, index) => {
        if (item && typeof item === 'object' && 'label' in item && 'value' in item)
            return item;
        return { label: String.fromCharCode(65 + index), value: String(item) };
    }));
}
function makeId(category, question) {
    const slug = `${category}-${question}`
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48) || 'question';
    const hash = [...`${category}|${question}`].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
    return `${slug}-${hash.toString(36)}`;
}
function normalizeQuestion(input) {
    const category = input.category?.trim() || 'JavaScript 基础';
    const question = input.question?.trim() || '';
    const type = validTypes.has(input.type ?? '') ? input.type : 'short_answer';
    const difficulty = validDifficulties.has(input.difficulty ?? '')
        ? input.difficulty
        : 'medium';
    const options = normalizeOptions(input.options);
    if (!question)
        throw new Error('question is required');
    if (!input.answer?.trim())
        throw new Error('answer is required');
    if (!input.explanation?.trim())
        throw new Error('explanation is required');
    if (type === 'choice' && !options)
        throw new Error('choice question requires options');
    return {
        id: input.id?.trim() || makeId(category, question), category, type, difficulty, question,
        options, answer: input.answer.trim(), explanation: input.explanation.trim(),
        keywords: JSON.stringify(stringArray(input.keywords)),
        commonMissingPoints: JSON.stringify(stringArray(input.commonMissingPoints)),
        codeExample: input.codeExample?.trim() || null,
        followUps: (() => { const values = stringArray(input.followUps); return values.length ? JSON.stringify(values) : null; })(),
        sourceName: input.sourceName?.trim() || '公开前端面试知识点整理',
        sourceUrl: input.sourceUrl?.trim() || 'manual', quality: input.quality?.trim() || 'generated',
        priority: Number.isFinite(input.priority) ? input.priority : null,
    };
}
