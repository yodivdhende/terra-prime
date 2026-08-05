const test = require('node:test');
const assert = require('node:assert/strict');
const { parseDocLinkUrl_, computeGraphFromLinks_ } = require('../src/LinkGraph.gs');

test('parseDocLinkUrl_ extracts the doc ID from a plain doc URL', () => {
	assert.deepEqual(parseDocLinkUrl_('https://docs.google.com/document/d/abc123/edit'), {
		docId: 'abc123',
		headingId: null
	});
});

test('parseDocLinkUrl_ extracts the heading fragment when present', () => {
	assert.deepEqual(parseDocLinkUrl_('https://docs.google.com/document/d/abc123/edit#heading=h.xyz789'), {
		docId: 'abc123',
		headingId: 'h.xyz789'
	});
});

test('parseDocLinkUrl_ returns null for a non-Docs URL', () => {
	assert.equal(parseDocLinkUrl_('https://example.com/foo'), null);
	assert.equal(parseDocLinkUrl_(''), null);
	assert.equal(parseDocLinkUrl_(null), null);
});

test('computeGraphFromLinks_ builds a node per doc and an edge per link', () => {
	const docs = [
		{ id: 'a', name: 'Doc A', outboundLinks: [{ targetId: 'b' }] },
		{ id: 'b', name: 'Doc B', outboundLinks: [] }
	];
	const graph = computeGraphFromLinks_(docs);
	assert.deepEqual(graph.nodes, [
		{ id: 'a', name: 'Doc A', type: 'doc' },
		{ id: 'b', name: 'Doc B', type: 'doc' }
	]);
	assert.deepEqual(graph.edges, [{ source: 'a', target: 'b' }]);
});

test('computeGraphFromLinks_ dedups repeated links between the same pair of docs', () => {
	const docs = [
		{ id: 'a', name: 'Doc A', outboundLinks: [{ targetId: 'b' }, { targetId: 'b' }] },
		{ id: 'b', name: 'Doc B', outboundLinks: [] }
	];
	assert.equal(computeGraphFromLinks_(docs).edges.length, 1);
});

test('computeGraphFromLinks_ excludes links whose target is outside the provided doc set', () => {
	const docs = [{ id: 'a', name: 'Doc A', outboundLinks: [{ targetId: 'outside-vault' }] }];
	const graph = computeGraphFromLinks_(docs);
	assert.equal(graph.edges.length, 0);
	assert.equal(graph.nodes.length, 1);
});
