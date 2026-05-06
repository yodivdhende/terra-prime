import { json } from '@sveltejs/kit';
import { getGoogleDriveManager } from '$lib/managers/google-drive-manager.svelte';

export async function GET({ params }) {
	const manager = getGoogleDriveManager();
	const files = await manager.getFolderFiles(params.fileId);
	return json(files);
}
