var VAULT_FOLDER_ID_KEY = 'VAULT_FOLDER_ID';

function getVaultFolderId() {
	return PropertiesService.getUserProperties().getProperty(VAULT_FOLDER_ID_KEY);
}

function setVaultFolderId(folderIdOrUrl) {
	var id = extractFolderId_(folderIdOrUrl);
	var folder = DriveApp.getFolderById(id);
	PropertiesService.getUserProperties().setProperty(VAULT_FOLDER_ID_KEY, id);
	return { id: id, name: folder.getName() };
}

function isVaultConfigured() {
	return !!getVaultFolderId();
}

function resetVaultFolder() {
	PropertiesService.getUserProperties().deleteProperty(VAULT_FOLDER_ID_KEY);
}

function extractFolderId_(folderIdOrUrl) {
	if (!folderIdOrUrl || !String(folderIdOrUrl).trim()) {
		throw new Error('Enter a folder ID or a Drive folder URL.');
	}
	var trimmed = String(folderIdOrUrl).trim();
	var match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
	return match ? match[1] : trimmed;
}

if (typeof module !== 'undefined') {
	module.exports = { extractFolderId_: extractFolderId_ };
}
