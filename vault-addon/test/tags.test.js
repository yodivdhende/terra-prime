const test = require('node:test');
const assert = require('node:assert/strict');
const { extractTags_, computeTagIndex_, mergeTagEdges_ } = require('../src/Tags.gs');

test('extractTags_ finds #tag tokens and lowercases + dedups them', () => {
	assert.deepEqual(extractTags_('Meeting notes #Project and more #project stuff #TODO'), ['#project', '#todo']);
});

test('extractTags_ ignores a bare "#" or "#" followed by a digit', () => {
	assert.deepEqual(extractTags_('Section # 3 and #1 are not tags'), []);
});

test('extractTags_ returns an empty array for empty/undefined text', () => {
	assert.deepEqual(extractTags_(''), []);
	assert.deepEqual(extractTags_(undefined), []);
});

test('computeTagIndex_ groups docs by tag, sorted alphabetically', () => {
	const docsWithTags = [
		{ id: 'a', name: 'Doc A', tags: ['#alpha', '#shared'] },
		{ id: 'b', name: 'Doc B', tags: ['#shared'] }
	];
	assert.deepEqual(computeTagIndex_(docsWithTags), [
		{ tag: '#alpha', docs: [{ id: 'a', name: 'Doc A' }] },
		{
			tag: '#shared',
			docs: [
				{ id: 'a', name: 'Doc A' },
				{ id: 'b', name: 'Doc B' }
			]
		}
	]);
});

test('computeTagIndex_ returns an empty array when no docs have tags', () => {
	assert.deepEqual(computeTagIndex_([{ id: 'a', name: 'Doc A', tags: [] }]), []);
});

test('mergeTagEdges_ adds one tag node per distinct tag and a doc-to-tag edge per occurrence', () => {
	const graph = {
		nodes: [
			{ id: 'a', name: 'Doc A', type: 'doc' },
			{ id: 'b', name: 'Doc B', type: 'doc' }
		],
		edges: [{ source: 'a', target: 'b' }]
	};
	const docsWithTags = [
		{ id: 'a', tags: ['#shared'] },
		{ id: 'b', tags: ['#shared'] }
	];
	const merged = mergeTagEdges_(graph, docsWithTags);
	assert.deepEqual(
		merged.nodes.filter((n) => n.type === 'tag'),
		[{ id: 'tag:#shared', name: '#shared', type: 'tag' }]
	);
	assert.deepEqual(
		merged.edges.filter((e) => e.type === 'tag'),
		[
			{ source: 'a', target: 'tag:#shared', type: 'tag' },
			{ source: 'b', target: 'tag:#shared', type: 'tag' }
		]
	);
	assert.equal(merged.edges.length, graph.edges.length + 2);
});

test('mergeTagEdges_ ignores tags on docs that are not in the graph', () => {
	const graph = { nodes: [{ id: 'a', name: 'Doc A', type: 'doc' }], edges: [] };
	const merged = mergeTagEdges_(graph, [{ id: 'not-in-graph', tags: ['#orphan'] }]);
	assert.deepEqual(merged.nodes, graph.nodes);
	assert.deepEqual(merged.edges, []);
});
