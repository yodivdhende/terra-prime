import { json, error } from '@sveltejs/kit';
import { getGoogleDriveManager } from '$lib/managers/google-drive-manager.svelte';

export async function GET({ url }) {
	const query = url.searchParams.get('q')?.trim();
	if (!query) return json([]);
	if (query.length < 2) return json([]);

	try {
		const files = await getGoogleDriveManager().searchFiles(query);
		return json(files);
	} catch (_error) {
		console.error(_error);
		error(500);
	}
}
