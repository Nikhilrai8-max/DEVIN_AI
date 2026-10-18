import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSystemPrompt, normalizeModelResponse } from '../services/ai.service.js';

test('buildSystemPrompt requests detailed answers and project files', () => {
    const prompt = buildSystemPrompt();

    assert.match(prompt, /detailed/i);
    assert.match(prompt, /complete/i);
    assert.match(prompt, /fileTree/i);
});

test('normalizeModelResponse converts plain text into a structured response', () => {
    const result = normalizeModelResponse('This is a detailed explanation of REST APIs.');

    assert.equal(result.text, 'This is a detailed explanation of REST APIs.');
    assert.equal(result.fileTree, undefined);
});

test('normalizeModelResponse parses JSON content when present', () => {
    const result = normalizeModelResponse('{"text":"Parsed response","fileTree":{}}');

    assert.equal(result.text, 'Parsed response');
    assert.deepEqual(result.fileTree, {});
});
