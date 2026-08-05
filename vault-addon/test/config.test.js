const test = require('node:test');
const assert = require('node:assert/strict');
const { extractFolderId_ } = require('../src/Config.gs');

test('extractFolderId_ returns a bare ID unchanged', () => {
	assert.equal(extractFolderId_('abc123XYZ'), 'abc123XYZ');
});

test('extractFolderId_ trims surrounding whitespace on a bare ID', () => {
	assert.equal(extractFolderId_('  abc123  '), 'abc123');
});

test('extractFolderId_ extracts the ID out of a folder URL', () => {
	assert.equal(
		extractFolderId_('https://drive.google.com/drive/folders/1AbC-_23xyz?usp=sharing'),
		'1AbC-_23xyz'
	);
});

test('extractFolderId_ throws on empty input', () => {
	assert.throws(() => extractFolderId_(''), /folder ID or a Drive folder URL/);
	assert.throws(() => extractFolderId_('   '), /folder ID or a Drive folder URL/);
	assert.throws(() => extractFolderId_(undefined), /folder ID or a Drive folder URL/);
});
