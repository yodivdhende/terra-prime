function parseDocLinkUrl_(url) {
	if (!url) {
		return null;
	}
	var docMatch = String(url).match(/^https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
	if (!docMatch) {
		return null;
	}
	var headingMatch = String(url).match(/#heading=([a-zA-Z0-9_.-]+)/);
	return { docId: docMatch[1], headingId: headingMatch ? headingMatch[1] : null };
}

function findAllTextElements_(element) {
	if (element.getType() === DocumentApp.ElementType.TEXT) {
		return [element.asText()];
	}
	var results = [];
	if (typeof element.getNumChildren === 'function') {
		var numChildren = element.getNumChildren();
		for (var i = 0; i < numChildren; i++) {
			results = results.concat(findAllTextElements_(element.getChild(i)));
		}
	}
	return results;
}

function extractLinksFromTextElement_(textElement, sourceDocId, vaultDocIdSet) {
	var content = textElement.getText();
	var indices = textElement.getTextAttributeIndices();
	var links = [];
	for (var i = 0; i < indices.length; i++) {
		var start = indices[i];
		var end = i + 1 < indices.length ? indices[i + 1] : content.length;
		var url = textElement.getLinkUrl(start);
		if (!url) {
			continue;
		}
		var parsed = parseDocLinkUrl_(url);
		if (!parsed || parsed.docId === sourceDocId || !vaultDocIdSet.has(parsed.docId)) {
			continue;
		}
		links.push({
			targetDocId: parsed.docId,
			headingId: parsed.headingId,
			text: content.substring(start, end),
			start: start,
			end: end
		});
	}
	return links;
}

function extractOutboundLinks_(docId, vaultDocIdSet) {
	var body = DocumentApp.openById(docId).getBody();
	var links = [];
	findAllTextElements_(body).forEach(function (textElement) {
		links = links.concat(extractLinksFromTextElement_(textElement, docId, vaultDocIdSet));
	});
	return links;
}

function computeGraphFromLinks_(docs) {
	var nodesById = {};
	docs.forEach(function (doc) {
		nodesById[doc.id] = { id: doc.id, name: doc.name, type: 'doc' };
	});
	var edges = [];
	var seenEdgeKeys = {};
	docs.forEach(function (doc) {
		(doc.outboundLinks || []).forEach(function (link) {
			if (!nodesById[link.targetId]) {
				return;
			}
			var key = doc.id + '->' + link.targetId;
			if (seenEdgeKeys[key]) {
				return;
			}
			seenEdgeKeys[key] = true;
			edges.push({ source: doc.id, target: link.targetId });
		});
	});
	return {
		nodes: Object.keys(nodesById).map(function (id) {
			return nodesById[id];
		}),
		edges: edges
	};
}

function vaultDocIdSetFrom_(vaultDocs) {
	var set = new Set();
	vaultDocs.forEach(function (doc) {
		set.add(doc.id);
	});
	return set;
}

function buildLinkGraph() {
	var vaultDocs = buildVaultIndex();
	var vaultDocIdSet = vaultDocIdSetFrom_(vaultDocs);
	var docsWithLinks = vaultDocs.map(function (doc) {
		var links = extractOutboundLinks_(doc.id, vaultDocIdSet);
		return {
			id: doc.id,
			name: doc.name,
			outboundLinks: links.map(function (link) {
				return { targetId: link.targetDocId };
			})
		};
	});
	return computeGraphFromLinks_(docsWithLinks);
}

function getOutboundLinksForDoc(docId) {
	var vaultDocs = buildVaultIndex();
	var vaultDocIdSet = vaultDocIdSetFrom_(vaultDocs);
	var nameById = {};
	vaultDocs.forEach(function (doc) {
		nameById[doc.id] = doc.name;
	});
	return extractOutboundLinks_(docId, vaultDocIdSet).map(function (link) {
		return {
			targetDocId: link.targetDocId,
			targetName: nameById[link.targetDocId] || link.targetDocId,
			headingId: link.headingId,
			text: link.text
		};
	});
}

function getBacklinksForDoc(docId) {
	var vaultDocs = buildVaultIndex();
	var vaultDocIdSet = vaultDocIdSetFrom_(vaultDocs);
	var backlinks = [];
	vaultDocs.forEach(function (doc) {
		if (doc.id === docId) {
			return;
		}
		extractOutboundLinks_(doc.id, vaultDocIdSet).forEach(function (link) {
			if (link.targetDocId !== docId) {
				return;
			}
			backlinks.push({ sourceDocId: doc.id, sourceName: doc.name, headingId: link.headingId, text: link.text });
		});
	});
	return backlinks;
}

if (typeof module !== 'undefined') {
	module.exports = {
		parseDocLinkUrl_: parseDocLinkUrl_,
		computeGraphFromLinks_: computeGraphFromLinks_
	};
}
