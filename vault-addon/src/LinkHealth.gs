function checkLinkHealth_(link, vaultDocIdSet, headingIdSetByTargetDoc) {
	if (!vaultDocIdSet.has(link.targetDocId)) {
		return 'target-missing';
	}
	if (link.headingId) {
		var headingIds = headingIdSetByTargetDoc[link.targetDocId];
		if (!headingIds || !headingIds.has(link.headingId)) {
			return 'heading-missing';
		}
	}
	return 'ok';
}

function headingIdSetForDoc_(docId) {
	var set = new Set();
	getHeadingIdMap_(docId).forEach(function (id) {
		if (id) {
			set.add(id);
		}
	});
	return set;
}

function getBrokenLinksReport() {
	var vaultDocs = buildVaultIndex();
	var vaultDocIdSet = vaultDocIdSetFrom_(vaultDocs);
	var headingIdSetCache = {};
	var report = [];
	vaultDocs.forEach(function (doc) {
		extractAllDocLinks_(doc.id).forEach(function (link) {
			var headingIdSetByTargetDoc = {};
			if (vaultDocIdSet.has(link.targetDocId) && link.headingId) {
				if (!headingIdSetCache[link.targetDocId]) {
					headingIdSetCache[link.targetDocId] = headingIdSetForDoc_(link.targetDocId);
				}
				headingIdSetByTargetDoc[link.targetDocId] = headingIdSetCache[link.targetDocId];
			}
			var status = checkLinkHealth_(link, vaultDocIdSet, headingIdSetByTargetDoc);
			if (status === 'ok') {
				return;
			}
			report.push({
				sourceDocId: doc.id,
				sourceDocName: doc.name,
				targetDocId: link.targetDocId,
				linkText: link.text,
				status: status
			});
		});
	});
	return report;
}

if (typeof module !== 'undefined') {
	module.exports = { checkLinkHealth_: checkLinkHealth_ };
}
