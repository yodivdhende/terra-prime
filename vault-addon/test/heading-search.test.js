const test = require('node:test');
const assert = require('node:assert/strict');
const { matchScore_, rankHeadingMatches_ } = require('../src/CursorContext.gs');

test('matchScore_ ranks an exact match best, then prefix, then substring', () => {
	assert.equal(matchScore_('intro', 'intro'), 0);
	assert.equal(matchScore_('introduction', 'intro'), 1);
	assert.equal(matchScore_('project introduction', 'intro'), 2);
	assert.equal(matchScore_('nothing relevant', 'intro'), null);
});

test('matchScore_ with an empty needle scores by haystack length (mild "show something" default)', () => {
	assert.equal(matchScore_('ab', ''), 2);
	assert.equal(matchScore_('abcdef', ''), 6);
});

const headingIndex = [
	{ docId: 'a', docName: 'Doc A', text: 'Project Introduction', level: 1, headingId: 'h.a1' },
	{ docId: 'b', docName: 'Doc B', text: 'Introduction', level: 1, headingId: 'h.b1' },
	{ docId: 'c', docName: 'Doc C', text: 'Unrelated', level: 1, headingId: 'h.c1' }
];

test('rankHeadingMatches_ puts the exact match first, then prefix/substring, excludes non-matches', () => {
	const results = rankHeadingMatches_(headingIndex, 'introduction', 10);
	assert.deepEqual(
		results.map((r) => r.text),
		['Introduction', 'Project Introduction']
	);
});

test('rankHeadingMatches_ caps results at maxResults', () => {
	const results = rankHeadingMatches_(headingIndex, '', 2);
	assert.equal(results.length, 2);
});

test('rankHeadingMatches_ returns an empty array when nothing matches', () => {
	assert.deepEqual(rankHeadingMatches_(headingIndex, 'zzz-no-match', 10), []);
});
