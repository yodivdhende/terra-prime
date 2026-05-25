import { json } from '@sveltejs/kit';
import { getGoogleDriveService } from '$lib/services/google-drive-service';

export async function GET({ params }) {
	const manager = getGoogleDriveService();
	const files = await manager.getFolderFiles(params.fileId);
	return json(files);
}
