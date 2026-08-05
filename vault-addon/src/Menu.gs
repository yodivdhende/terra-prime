function onOpen(e) {
	DocumentApp.getUi()
		.createMenu('Vault Links')
		.addItem('Open sidebar (coming soon)', 'showSidebar')
		.addToUi();
}

function showSidebar() {
	var html = HtmlService.createHtmlOutput('<p>Vault Links sidebar — under construction.</p>').setTitle('Vault Links');
	DocumentApp.getUi().showSidebar(html);
}
