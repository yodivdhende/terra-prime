import { error, type RequestHandler } from '@sveltejs/kit';
import { getGoogleDriveManager } from '$lib/managers/google-drive-manager.svelte';

export const GET: RequestHandler = async ({ params }) => {
	const { fileId } = params;
	const stream = await getGoogleDriveManager().getFileStream(fileId);
	return new Response(stream, {
		headers: {
			'Content-Type': 'application/pdf',
			'Cache-Control': 'private, max-age=3600',
		},
	});
};
