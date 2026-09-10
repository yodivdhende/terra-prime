import { google } from 'googleapis';
import { VITE_GOOGLE_CLIENT_EMAIL, VITE_GOOGLE_PRIVATE_KEY } from '$env/static/private';

const SCOPES = [
	'https://www.googleapis.com/auth/drive',
	'https://www.googleapis.com/auth/documents'
];

const BACKSTORY_FOLDER_ID = '1IET6eLvhyEwpYiTOaWf7Xq-DvaoTTJCh';

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
		const drive = google.drive({ version: 'v3', auth });

		const file = await drive.files.create({
			requestBody: {
				name: `${characterName} - Backstory`,
				mimeType: 'application/vnd.google-apps.document',
				parents: [BACKSTORY_FOLDER_ID]
			},
			fields: 'id',
			supportsAllDrives: true
		});

		const docId = file.data.id!;

		try {
			await drive.permissions.create({
				fileId: docId,
				requestBody: { type: 'anyone', role: 'writer' },
				supportsAllDrives: true
			});
		} catch (err) {
			console.warn('could not set anyone-with-link permission on backstory doc', err);
		}

		return docId;
	}
}

export function getGoogleDocsManager() {
	return new GoogleDocsManager();
}
