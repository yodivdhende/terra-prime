const test = require('node:test');
const assert = require('node:assert/strict');
const { detectTrigger_ } = require('../src/CursorContext.gs');

test('detectTrigger_ finds an open trigger and captures the query so far', () => {
	assert.deepEqual(detectTrigger_('some text [[Proj'), { triggerFound: true, query: 'Proj' });
});

test('detectTrigger_ captures an empty query right after typing [[', () => {
	assert.deepEqual(detectTrigger_('some text [['), { triggerFound: true, query: '' });
});

test('detectTrigger_ finds nothing when there is no [[ at all', () => {
	assert.deepEqual(detectTrigger_('just some normal text'), { triggerFound: false });
});

test('detectTrigger_ treats a closed ]] as no active trigger', () => {
	assert.deepEqual(detectTrigger_('see [[Project Alpha]] for details'), { triggerFound: false });
});

test('detectTrigger_ uses the most recent [[ when there are two', () => {
	assert.deepEqual(detectTrigger_('[[Old Query then [[New'), { triggerFound: true, query: 'New' });
});

test('detectTrigger_ handles empty/undefined input', () => {
	assert.deepEqual(detectTrigger_(''), { triggerFound: false });
	assert.deepEqual(detectTrigger_(undefined), { triggerFound: false });
});
