import { google } from 'googleapis';
import { VITE_GOOGLE_CLIENT_EMAIL, VITE_GOOGLE_PRIVATE_KEY } from '$env/static/private';

const SCOPES = [
	'https://www.googleapis.com/auth/drive',
	'https://www.googleapis.com/auth/documents'
];

export const enum BackstoryFolder {
	Character = '1IET6eLvhyEwpYiTOaWf7Xq-DvaoTTJCh',
	Subco = '1P6-cqLg-8byXrOr05h41m2INZeTa05ug'
}

export class GoogleDocsManager {
	private getClient() {
		return new google.auth.JWT(
			VITE_GOOGLE_CLIENT_EMAIL,
			undefined,
			VITE_GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
			SCOPES
		);
	}

	public async createBackstoryDoc(name: string, folder: BackstoryFolder = BackstoryFolder.Character): Promise<string> {
		const auth = this.getClient();
		const drive = google.drive({ version: 'v3', auth });

		const file = await drive.files.create({
			requestBody: {
				name: `${name} - Backstory`,
				mimeType: 'application/vnd.google-apps.document',
				parents: [folder]
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
