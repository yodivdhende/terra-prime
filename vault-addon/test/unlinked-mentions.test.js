const test = require('node:test');
const assert = require('node:assert/strict');
const { findFirstUnlinkedOccurrence_, findUnlinkedMentions_ } = require('../src/UnlinkedMentions.gs');

test('findFirstUnlinkedOccurrence_ finds a case-insensitive match', () => {
	assert.equal(findFirstUnlinkedOccurrence_('See Project Alpha for details', 'project alpha', []), 4);
});

test('findFirstUnlinkedOccurrence_ skips a match that overlaps an existing linked range', () => {
	const text = 'See Project Alpha, then Project Alpha again';
	// "Project Alpha" first occurrence is [4, 17) - already linked.
	const index = findFirstUnlinkedOccurrence_(text, 'Project Alpha', [{ start: 4, end: 17 }]);
	assert.equal(index, 24);
});

test('findFirstUnlinkedOccurrence_ returns -1 when every occurrence is already linked', () => {
	const text = 'Project Alpha';
	assert.equal(findFirstUnlinkedOccurrence_(text, 'Project Alpha', [{ start: 0, end: 13 }]), -1);
});

test('findFirstUnlinkedOccurrence_ returns -1 when there is no occurrence at all', () => {
	assert.equal(findFirstUnlinkedOccurrence_('Nothing relevant here', 'Project Alpha', []), -1);
});

test('findUnlinkedMentions_ reports one mention per target doc, deduped', () => {
	const text = 'Project Alpha is discussed, and Project Alpha again later.';
	const titleIndex = [{ id: 'a', title: 'Project Alpha' }];
	assert.deepEqual(findUnlinkedMentions_(text, [], titleIndex), [{ docId: 'a', docName: 'Project Alpha', index: 0 }]);
});

test('findUnlinkedMentions_ skips targets with no unlinked occurrence', () => {
	const text = 'Project Alpha is discussed.';
	const titleIndex = [
		{ id: 'a', title: 'Project Alpha' },
		{ id: 'b', title: 'Nowhere To Be Found' }
	];
	assert.deepEqual(findUnlinkedMentions_(text, [], titleIndex), [{ docId: 'a', docName: 'Project Alpha', index: 0 }]);
});

test('findUnlinkedMentions_ respects the maxResults cap', () => {
	const text = 'Alpha Beta Gamma';
	const titleIndex = [
		{ id: 'a', title: 'Alpha' },
		{ id: 'b', title: 'Beta' },
		{ id: 'c', title: 'Gamma' }
	];
	assert.equal(findUnlinkedMentions_(text, [], titleIndex, 2).length, 2);
});
