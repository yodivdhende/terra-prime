function detectTrigger_(precedingText) {
	if (!precedingText) {
		return { triggerFound: false };
	}
	var openIndex = precedingText.lastIndexOf('[[');
	if (openIndex === -1) {
		return { triggerFound: false };
	}
	var query = precedingText.substring(openIndex + 2);
	if (query.indexOf(']]') !== -1) {
		return { triggerFound: false };
	}
	return { triggerFound: true, query: query };
}

function matchScore_(haystack, needle) {
	if (!needle) {
		return haystack.length;
	}
	if (haystack === needle) {
		return 0;
	}
	if (haystack.indexOf(needle) === 0) {
		return 1;
	}
	if (haystack.indexOf(needle) !== -1) {
		return 2;
	}
	return null;
}

function rankHeadingMatches_(headingIndex, queryText, maxResults) {
	var needle = String(queryText || '')
		.toLowerCase()
		.trim();
	var scored = [];
	headingIndex.forEach(function (entry) {
		var score = matchScore_((entry.text || '').toLowerCase(), needle);
		if (score === null) {
			return;
		}
		scored.push({ entry: entry, score: score });
	});
	scored.sort(function (a, b) {
		if (a.score !== b.score) {
			return a.score - b.score;
		}
		return a.entry.text.localeCompare(b.entry.text);
	});
	return scored.slice(0, maxResults).map(function (s) {
		return s.entry;
	});
}

var CURSOR_CONTEXT_LOOKBACK_CHARS_ = 100;
var MAX_HEADING_SUGGESTIONS_ = 8;

function findMatchingHeadings_(queryText) {
	return rankHeadingMatches_(getGlobalHeadingIndex_(), queryText, MAX_HEADING_SUGGESTIONS_);
}

function getCursorContext() {
	var doc = DocumentApp.getActiveDocument();
	var cursor = doc.getCursor();
	if (!cursor) {
		return { active: false, triggerFound: false };
	}
	var surroundingText = cursor.getSurroundingText().getText();
	var offset = cursor.getSurroundingTextOffset();
	var start = Math.max(0, offset - CURSOR_CONTEXT_LOOKBACK_CHARS_);
	var preceding = surroundingText.substring(start, offset);
	var trigger = detectTrigger_(preceding);
	if (!trigger.triggerFound) {
		return { active: true, triggerFound: false };
	}
	return {
		active: true,
		triggerFound: true,
		query: trigger.query,
		suggestions: findMatchingHeadings_(trigger.query)
	};
}

if (typeof module !== 'undefined') {
	module.exports = {
		detectTrigger_: detectTrigger_,
		matchScore_: matchScore_,
		rankHeadingMatches_: rankHeadingMatches_
	};
}
