const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDocLinkUrl_ } = require('../src/LinkInsert.gs');

test('buildDocLinkUrl_ returns a whole-document URL when no headingId is given', () => {
	assert.equal(buildDocLinkUrl_('abc123', null), 'https://docs.google.com/document/d/abc123/edit');
	assert.equal(buildDocLinkUrl_('abc123', undefined), 'https://docs.google.com/document/d/abc123/edit');
	assert.equal(buildDocLinkUrl_('abc123', ''), 'https://docs.google.com/document/d/abc123/edit');
});

test('buildDocLinkUrl_ appends the heading fragment when a headingId is given', () => {
	assert.equal(
		buildDocLinkUrl_('abc123', 'h.xyz789'),
		'https://docs.google.com/document/d/abc123/edit#heading=h.xyz789'
	);
});
