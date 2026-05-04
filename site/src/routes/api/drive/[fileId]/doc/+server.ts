import { type RequestHandler } from '@sveltejs/kit';
import { getGoogleDriveManager } from '$lib/managers/google-drive-manager.svelte';

export const GET: RequestHandler = async ({ params }) => {
	const { fileId } = params;
	const html = await getGoogleDriveManager().getDocumentHtml(fileId);
	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': 'private, max-age=3600',
		},
	});
};
