var HEADING_LEVEL_BY_ENUM_ = null;

function getHeadingsForDoc_(docId) {
	var body = DocumentApp.openById(docId).getBody();
	var headings = [];
	var numChildren = body.getNumChildren();
	for (var i = 0; i < numChildren; i++) {
		var child = body.getChild(i);
		if (child.getType() !== DocumentApp.ElementType.PARAGRAPH) {
			continue;
		}
		var paragraph = child.asParagraph();
		var level = headingEnumToLevel_(paragraph.getHeading());
		if (level === null) {
			continue;
		}
		headings.push({ text: paragraph.getText(), level: level });
	}
	return headings;
}

function headingEnumToLevel_(heading) {
	if (!HEADING_LEVEL_BY_ENUM_) {
		HEADING_LEVEL_BY_ENUM_ = {};
		HEADING_LEVEL_BY_ENUM_[DocumentApp.ParagraphHeading.HEADING1] = 1;
		HEADING_LEVEL_BY_ENUM_[DocumentApp.ParagraphHeading.HEADING2] = 2;
		HEADING_LEVEL_BY_ENUM_[DocumentApp.ParagraphHeading.HEADING3] = 3;
		HEADING_LEVEL_BY_ENUM_[DocumentApp.ParagraphHeading.HEADING4] = 4;
		HEADING_LEVEL_BY_ENUM_[DocumentApp.ParagraphHeading.HEADING5] = 5;
		HEADING_LEVEL_BY_ENUM_[DocumentApp.ParagraphHeading.HEADING6] = 6;
	}
	var mapped = HEADING_LEVEL_BY_ENUM_[heading];
	return mapped === undefined ? null : mapped;
}

function getHeadingIdMap_(docId) {
	var docResource = Docs.Documents.get(docId, {
		fields: 'body.content.paragraph.paragraphStyle(headingId,namedStyleType)'
	});
	return extractHeadingIdsInOrder_(docResource);
}

function extractHeadingIdsInOrder_(docResource) {
	var content = (docResource && docResource.body && docResource.body.content) || [];
	var ids = [];
	content.forEach(function (structuralElement) {
		var paragraph = structuralElement.paragraph;
		if (!paragraph) {
			return;
		}
		var style = paragraph.paragraphStyle || {};
		var namedStyleType = style.namedStyleType || '';
		if (namedStyleType.indexOf('HEADING_') !== 0) {
			return;
		}
		ids.push(style.headingId || null);
	});
	return ids;
}

function getDocHeadingsWithAnchors(docId) {
	var headings = getHeadingsForDoc_(docId);
	var headingIds = getHeadingIdMap_(docId);
	return mergeHeadingsWithIds_(headings, headingIds);
}

function mergeHeadingsWithIds_(headings, headingIdsInOrder) {
	return headings.map(function (heading, index) {
		return {
			text: heading.text,
			level: heading.level,
			headingId: headingIdsInOrder[index] || null
		};
	});
}

var GLOBAL_HEADING_INDEX_CACHE_KEY_ = 'GLOBAL_HEADING_INDEX';
var GLOBAL_HEADING_INDEX_CACHE_TTL_SECONDS_ = 300;

function getGlobalHeadingIndex_() {
	var cache = CacheService.getUserCache();
	var cached = cache.get(GLOBAL_HEADING_INDEX_CACHE_KEY_);
	if (cached) {
		return JSON.parse(cached);
	}
	var index = buildGlobalHeadingIndex_(buildVaultIndex());
	cache.put(GLOBAL_HEADING_INDEX_CACHE_KEY_, JSON.stringify(index), GLOBAL_HEADING_INDEX_CACHE_TTL_SECONDS_);
	return index;
}

function buildGlobalHeadingIndex_(vaultDocs) {
	var index = [];
	vaultDocs.forEach(function (doc) {
		getDocHeadingsWithAnchors(doc.id).forEach(function (heading) {
			index.push({
				docId: doc.id,
				docName: doc.name,
				text: heading.text,
				level: heading.level,
				headingId: heading.headingId
			});
		});
	});
	return index;
}

function getActiveDocHeadings() {
	return getDocHeadingsWithAnchors(DocumentApp.getActiveDocument().getId());
}

if (typeof module !== 'undefined') {
	module.exports = {
		extractHeadingIdsInOrder_: extractHeadingIdsInOrder_,
		mergeHeadingsWithIds_: mergeHeadingsWithIds_
	};
}
