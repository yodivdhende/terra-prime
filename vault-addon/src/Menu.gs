function onOpen(e) {
	DocumentApp.getUi()
		.createMenu('Vault Links')
		.addItem('Open sidebar', 'showSidebar')
		.addItem('Vault graph', 'showGraphModal')
		.addToUi();
}

function showSidebar() {
	var html = HtmlService.createTemplateFromFile('ui/Sidebar').evaluate().setTitle('Vault Links');
	DocumentApp.getUi().showSidebar(html);
}

function showGraphModal() {
	var html = HtmlService.createTemplateFromFile('ui/GraphModal').evaluate().setWidth(800).setHeight(600);
	DocumentApp.getUi().showModalDialog(html, 'Vault Graph');
}

function getActiveDocId() {
	return DocumentApp.getActiveDocument().getId();
}

function getGraphData() {
	return mergeTagEdges_(buildLinkGraph(), docsWithTags_());
}
