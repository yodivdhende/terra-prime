var VAULT_INDEX_CACHE_KEY = 'VAULT_INDEX';
var VAULT_INDEX_CACHE_TTL_SECONDS = 300;

function listVaultDocs_(folderId) {
	var results = [];
	var rootFolder = DriveApp.getFolderById(folderId);
	walkFolderForDocs_(rootFolder, rootFolder.getName(), results);
	return results;
}

function walkFolderForDocs_(folder, path, results) {
	var files = folder.getFilesByType(MimeType.GOOGLE_DOCS);
	while (files.hasNext()) {
		var file = files.next();
		results.push({
			id: file.getId(),
			name: file.getName(),
			url: file.getUrl(),
			path: path
		});
	}
	var subfolders = folder.getFolders();
	while (subfolders.hasNext()) {
		var sub = subfolders.next();
		walkFolderForDocs_(sub, path + '/' + sub.getName(), results);
	}
}

function buildVaultIndex() {
	var cache = CacheService.getUserCache();
	var cached = cache.get(VAULT_INDEX_CACHE_KEY);
	if (cached) {
		return JSON.parse(cached);
	}
	var folderId = getVaultFolderId();
	if (!folderId) {
		return [];
	}
	var docs = listVaultDocs_(folderId);
	cache.put(VAULT_INDEX_CACHE_KEY, JSON.stringify(docs), VAULT_INDEX_CACHE_TTL_SECONDS);
	return docs;
}

function refreshVaultIndex() {
	CacheService.getUserCache().remove(VAULT_INDEX_CACHE_KEY);
	return buildVaultIndex();
}

function searchVaultDocs(query) {
	return filterDocsByQuery_(buildVaultIndex(), query);
}

function filterDocsByQuery_(docs, query) {
	if (!query) {
		return docs;
	}
	var needle = String(query).toLowerCase();
	return docs.filter(function (doc) {
		return doc.name.toLowerCase().indexOf(needle) !== -1;
	});
}

if (typeof module !== 'undefined') {
	module.exports = { filterDocsByQuery_: filterDocsByQuery_ };
}
