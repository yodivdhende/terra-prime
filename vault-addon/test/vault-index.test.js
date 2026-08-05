const test = require('node:test');
const assert = require('node:assert/strict');
const { filterDocsByQuery_ } = require('../src/VaultIndex.gs');

const docs = [
	{ id: '1', name: 'Project Alpha', path: 'Vault' },
	{ id: '2', name: 'Beta Notes', path: 'Vault/Sub' },
	{ id: '3', name: 'alpha centauri', path: 'Vault/Sub' }
];

test('filterDocsByQuery_ returns all docs when query is empty', () => {
	assert.deepEqual(filterDocsByQuery_(docs, ''), docs);
	assert.deepEqual(filterDocsByQuery_(docs, undefined), docs);
});

test('filterDocsByQuery_ matches case-insensitively on a name substring', () => {
	assert.deepEqual(filterDocsByQuery_(docs, 'alpha'), [docs[0], docs[2]]);
});

test('filterDocsByQuery_ returns an empty array when nothing matches', () => {
	assert.deepEqual(filterDocsByQuery_(docs, 'zzz-no-match'), []);
});
