function buildDocLinkUrl_(targetDocId, headingId) {
	var base = 'https://docs.google.com/document/d/' + targetDocId + '/edit';
	return headingId ? base + '#heading=' + headingId : base;
}

function insertLinkAtCursor_(displayText, targetUrl) {
	var doc = DocumentApp.getActiveDocument();
	var cursor = doc.getCursor();
	if (!cursor) {
		throw new Error('Click into the document first, then try again.');
	}
	var inserted = cursor.insertText(displayText);
	if (!inserted) {
		throw new Error('Could not insert a link at the current cursor position.');
	}
	inserted.setLinkUrl(0, displayText.length - 1, targetUrl);
	doc.setCursor(doc.newPosition(inserted, displayText.length));
}

function insertLinkFromBrowser(targetDocId, headingId, displayText) {
	var url = buildDocLinkUrl_(targetDocId, headingId);
	insertLinkAtCursor_(displayText, url);
}

if (typeof module !== 'undefined') {
	module.exports = { buildDocLinkUrl_: buildDocLinkUrl_ };
}
