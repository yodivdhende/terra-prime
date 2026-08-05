function onOpen(e) {
	DocumentApp.getUi().createMenu('Vault Links').addItem('Open sidebar', 'showSidebar').addToUi();
}

function showSidebar() {
	var html = HtmlService.createTemplateFromFile('ui/Sidebar').evaluate().setTitle('Vault Links');
	DocumentApp.getUi().showSidebar(html);
}

function getActiveDocId() {
	return DocumentApp.getActiveDocument().getId();
}
