import { google } from 'googleapis';
import { VITE_GOOGLE_CLIENT_EMAIL, VITE_GOOGLE_PRIVATE_KEY } from '$env/static/private';

const SCOPES = [
	'https://www.googleapis.com/auth/drive',
	'https://www.googleapis.com/auth/documents'
];

export class GoogleDocsManager {
	private getClient() {
		return new google.auth.JWT(
			VITE_GOOGLE_CLIENT_EMAIL,
			undefined,
			VITE_GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
			SCOPES
		);
	}

	public async createBackstoryDoc(characterName: string): Promise<string> {
		const auth = this.getClient();
		const docs = google.docs({ version: 'v1', auth });
		const drive = google.drive({ version: 'v3', auth });

		const doc = await docs.documents.create({
			requestBody: { title: `${characterName} - Backstory` }
		});

		const docId = doc.data.documentId!;

		// TODO: move created doc into the designated backstory Drive folder
		await drive.permissions.create({
			fileId: docId,
			requestBody: { type: 'anyone', role: 'writer' }
		});

		return `https://docs.google.com/document/d/${docId}/edit`;
	}
}

export function getGoogleDocsManager() {
	return new GoogleDocsManager();
}
