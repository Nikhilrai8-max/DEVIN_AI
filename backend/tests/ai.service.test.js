import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAgentSystemPrompt, buildSystemPrompt, normalizeAgentProposal, normalizeModelResponse } from '../services/ai.service.js';

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

test('agent prompt requests a plan and reviewable complete file changes', () => {
    const prompt = buildAgentSystemPrompt();

    assert.match(prompt, /"plan"/);
    assert.match(prompt, /complete file contents/i);
    assert.match(prompt, /Never claim that tests were run/i);
});

test('normalizeAgentProposal accepts valid changes and canonicalizes paths', () => {
    const proposal = normalizeAgentProposal({
        summary: 'Add a page',
        plan: ['Create the page'],
        changes: [{ path: 'src\\page.jsx', action: 'create', content: 'export default function Page() {}' }],
    });

    assert.equal(proposal.changes[0].path, 'src/page.jsx');
    assert.equal(proposal.changes[0].action, 'create');
});

test('normalizeAgentProposal rejects unsafe and duplicate paths', () => {
    assert.throws(() => normalizeAgentProposal({
        plan: [],
        changes: [{ path: '../outside.txt', action: 'create', content: 'nope' }],
    }), /unsafe file path/i);

    assert.throws(() => normalizeAgentProposal({
        plan: [],
        changes: [
            { path: 'src/page.jsx', action: 'create', content: 'one' },
            { path: 'src/page.jsx', action: 'update', content: 'two' },
        ],
    }), /duplicate file paths/i);
});
