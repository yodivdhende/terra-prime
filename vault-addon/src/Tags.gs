function extractTags_(docText) {
	if (!docText) {
		return [];
	}
	var matches = docText.match(/#[a-zA-Z][a-zA-Z0-9_-]*/g) || [];
	var seen = {};
	var tags = [];
	matches.forEach(function (raw) {
		var tag = raw.toLowerCase();
		if (seen[tag]) {
			return;
		}
		seen[tag] = true;
		tags.push(tag);
	});
	return tags;
}

function getTagsForDoc_(docId) {
	return extractTags_(DocumentApp.openById(docId).getBody().getText());
}

function computeTagIndex_(docsWithTags) {
	var docsByTag = {};
	docsWithTags.forEach(function (doc) {
		(doc.tags || []).forEach(function (tag) {
			if (!docsByTag[tag]) {
				docsByTag[tag] = [];
			}
			docsByTag[tag].push({ id: doc.id, name: doc.name });
		});
	});
	return Object.keys(docsByTag)
		.sort()
		.map(function (tag) {
			return { tag: tag, docs: docsByTag[tag] };
		});
}

function mergeTagEdges_(graph, docsWithTags) {
	var nodeIds = {};
	graph.nodes.forEach(function (node) {
		nodeIds[node.id] = true;
	});
	var nodes = graph.nodes.slice();
	var edges = graph.edges.slice();
	var seenTagNodeIds = {};
	docsWithTags.forEach(function (doc) {
		if (!nodeIds[doc.id]) {
			return;
		}
		(doc.tags || []).forEach(function (tag) {
			var tagNodeId = 'tag:' + tag;
			if (!seenTagNodeIds[tagNodeId]) {
				seenTagNodeIds[tagNodeId] = true;
				nodes.push({ id: tagNodeId, name: tag, type: 'tag' });
			}
			edges.push({ source: doc.id, target: tagNodeId, type: 'tag' });
		});
	});
	return { nodes: nodes, edges: edges };
}

var TAG_INDEX_CACHE_KEY_ = 'TAG_INDEX';
var TAG_INDEX_CACHE_TTL_SECONDS_ = 300;

function buildTagIndex() {
	var cache = CacheService.getUserCache();
	var cached = cache.get(TAG_INDEX_CACHE_KEY_);
	if (cached) {
		return JSON.parse(cached);
	}
	var index = computeTagIndex_(docsWithTags_());
	cache.put(TAG_INDEX_CACHE_KEY_, JSON.stringify(index), TAG_INDEX_CACHE_TTL_SECONDS_);
	return index;
}

function docsWithTags_() {
	return buildVaultIndex().map(function (doc) {
		return { id: doc.id, name: doc.name, tags: getTagsForDoc_(doc.id) };
	});
}

if (typeof module !== 'undefined') {
	module.exports = {
		extractTags_: extractTags_,
		computeTagIndex_: computeTagIndex_,
		mergeTagEdges_: mergeTagEdges_
	};
}
