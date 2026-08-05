function rangesOverlap_(start, end, ranges) {
	return (ranges || []).some(function (range) {
		return start < range.end && end > range.start;
	});
}

function findFirstUnlinkedOccurrence_(text, needle, linkedRanges) {
	if (!text || !needle) {
		return -1;
	}
	var haystack = text.toLowerCase();
	var target = needle.toLowerCase();
	var searchFrom = 0;
	while (true) {
		var index = haystack.indexOf(target, searchFrom);
		if (index === -1) {
			return -1;
		}
		var end = index + target.length;
		if (!rangesOverlap_(index, end, linkedRanges)) {
			return index;
		}
		searchFrom = index + 1;
	}
}

function findUnlinkedMentions_(docPlainText, linkedRanges, vaultTitleIndex, maxResults) {
	var limit = typeof maxResults === 'number' ? maxResults : Infinity;
	var mentions = [];
	var seenTargetIds = {};
	for (var i = 0; i < vaultTitleIndex.length && mentions.length < limit; i++) {
		var entry = vaultTitleIndex[i];
		if (!entry.title || seenTargetIds[entry.id]) {
			continue;
		}
		var index = findFirstUnlinkedOccurrence_(docPlainText, entry.title, linkedRanges);
		if (index === -1) {
			continue;
		}
		seenTargetIds[entry.id] = true;
		mentions.push({ docId: entry.id, docName: entry.title, index: index });
	}
	return mentions;
}

var MAX_UNLINKED_MENTIONS_ = 20;

function getUnlinkedMentionsForDoc(docId) {
	var vaultDocs = buildVaultIndex();
	var vaultDocIdSet = vaultDocIdSetFrom_(vaultDocs);
	var docText = DocumentApp.openById(docId).getBody().getText();
	var linkedRanges = extractOutboundLinks_(docId, vaultDocIdSet).map(function (link) {
		return { start: link.start, end: link.end };
	});
	var titleIndex = vaultDocs
		.filter(function (doc) {
			return doc.id !== docId;
		})
		.map(function (doc) {
			return { id: doc.id, title: doc.name };
		});
	return findUnlinkedMentions_(docText, linkedRanges, titleIndex, MAX_UNLINKED_MENTIONS_);
}

function linkifyMention(sourceDocId, targetDocId) {
	var vaultDocs = buildVaultIndex();
	var target = vaultDocs.filter(function (doc) {
		return doc.id === targetDocId;
	})[0];
	if (!target) {
		throw new Error('Target document is no longer in the vault.');
	}
	var vaultDocIdSet = vaultDocIdSetFrom_(vaultDocs);
	var body = DocumentApp.openById(sourceDocId).getBody();
	var docText = body.getText();
	var linkedRanges = extractOutboundLinks_(sourceDocId, vaultDocIdSet).map(function (link) {
		return { start: link.start, end: link.end };
	});
	var index = findFirstUnlinkedOccurrence_(docText, target.name, linkedRanges);
	if (index === -1) {
		throw new Error('Could not find an unlinked mention of "' + target.name + '" anymore.');
	}
	var end = index + target.name.length - 1;
	body.editAsText().setLinkUrl(index, end, buildDocLinkUrl_(targetDocId, null));
}

if (typeof module !== 'undefined') {
	module.exports = {
		findFirstUnlinkedOccurrence_: findFirstUnlinkedOccurrence_,
		findUnlinkedMentions_: findUnlinkedMentions_
	};
}
