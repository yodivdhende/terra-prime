const test = require('node:test');
const assert = require('node:assert/strict');
const { checkLinkHealth_ } = require('../src/LinkHealth.gs');

test('checkLinkHealth_ returns "ok" for a link to an in-vault doc with no heading fragment', () => {
	const link = { targetDocId: 'a', headingId: null };
	assert.equal(checkLinkHealth_(link, new Set(['a']), {}), 'ok');
});

test('checkLinkHealth_ returns "ok" when the heading fragment matches a current heading', () => {
	const link = { targetDocId: 'a', headingId: 'h.111' };
	const headingIdSetByTargetDoc = { a: new Set(['h.111', 'h.222']) };
	assert.equal(checkLinkHealth_(link, new Set(['a']), headingIdSetByTargetDoc), 'ok');
});

test('checkLinkHealth_ returns "target-missing" when the target is no longer in the vault', () => {
	const link = { targetDocId: 'gone', headingId: null };
	assert.equal(checkLinkHealth_(link, new Set(['a', 'b']), {}), 'target-missing');
});

test('checkLinkHealth_ returns "heading-missing" when the target exists but the heading fragment does not', () => {
	const link = { targetDocId: 'a', headingId: 'h.deleted' };
	const headingIdSetByTargetDoc = { a: new Set(['h.111']) };
	assert.equal(checkLinkHealth_(link, new Set(['a']), headingIdSetByTargetDoc), 'heading-missing');
});

test('checkLinkHealth_ treats target-missing as taking priority over a heading check', () => {
	const link = { targetDocId: 'gone', headingId: 'h.111' };
	assert.equal(checkLinkHealth_(link, new Set(['a']), {}), 'target-missing');
});
