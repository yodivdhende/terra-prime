const test = require('node:test');
const assert = require('node:assert/strict');
const { extractHeadingIdsInOrder_, mergeHeadingsWithIds_ } = require('../src/Headings.gs');

test('extractHeadingIdsInOrder_ pulls headingId only for HEADING_* paragraphs, in order', () => {
	const docResource = {
		body: {
			content: [
				{ paragraph: { paragraphStyle: { namedStyleType: 'NORMAL_TEXT' } } },
				{ paragraph: { paragraphStyle: { namedStyleType: 'HEADING_1', headingId: 'h.aaa' } } },
				{ paragraph: { paragraphStyle: { namedStyleType: 'NORMAL_TEXT' } } },
				{ paragraph: { paragraphStyle: { namedStyleType: 'HEADING_2', headingId: 'h.bbb' } } },
				{ table: {} }
			]
		}
	};
	assert.deepEqual(extractHeadingIdsInOrder_(docResource), ['h.aaa', 'h.bbb']);
});

test('extractHeadingIdsInOrder_ returns null for a heading with no generated ID yet', () => {
	const docResource = {
		body: {
			content: [{ paragraph: { paragraphStyle: { namedStyleType: 'HEADING_1' } } }]
		}
	};
	assert.deepEqual(extractHeadingIdsInOrder_(docResource), [null]);
});

test('extractHeadingIdsInOrder_ handles an empty/missing body', () => {
	assert.deepEqual(extractHeadingIdsInOrder_({}), []);
	assert.deepEqual(extractHeadingIdsInOrder_({ body: {} }), []);
});

test('mergeHeadingsWithIds_ zips headings with their IDs by order', () => {
	const headings = [
		{ text: 'Intro', level: 1 },
		{ text: 'Details', level: 2 }
	];
	const ids = ['h.aaa', 'h.bbb'];
	assert.deepEqual(mergeHeadingsWithIds_(headings, ids), [
		{ text: 'Intro', level: 1, headingId: 'h.aaa' },
		{ text: 'Details', level: 2, headingId: 'h.bbb' }
	]);
});

test('mergeHeadingsWithIds_ falls back to null when an ID is missing', () => {
	const headings = [{ text: 'Intro', level: 1 }];
	assert.deepEqual(mergeHeadingsWithIds_(headings, [null]), [{ text: 'Intro', level: 1, headingId: null }]);
	assert.deepEqual(mergeHeadingsWithIds_(headings, []), [{ text: 'Intro', level: 1, headingId: null }]);
});
