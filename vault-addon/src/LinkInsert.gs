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

function findOpenTriggerRange_(cursor) {
	var surrounding = cursor.getSurroundingText();
	var text = surrounding.getText();
	var offset = cursor.getSurroundingTextOffset();
	var preceding = text.substring(0, offset);
	var openIndex = preceding.lastIndexOf('[[');
	if (openIndex === -1 || preceding.substring(openIndex).indexOf(']]') !== -1) {
		return null;
	}
	return { textElement: surrounding.getElement().asText(), start: openIndex, end: offset };
}

function insertVaultLink(targetDocId, headingId, displayText) {
	var doc = DocumentApp.getActiveDocument();
	var cursor = doc.getCursor();
	if (!cursor) {
		throw new Error('Click into the document first, then try again.');
	}
	var url = buildDocLinkUrl_(targetDocId, headingId);
	var triggerRange = findOpenTriggerRange_(cursor);
	if (triggerRange) {
		triggerRange.textElement.deleteText(triggerRange.start, triggerRange.end - 1);
		doc.setCursor(doc.newPosition(triggerRange.textElement, triggerRange.start));
	}
	insertLinkAtCursor_(displayText, url);
}

if (typeof module !== 'undefined') {
	module.exports = { buildDocLinkUrl_: buildDocLinkUrl_ };
}
