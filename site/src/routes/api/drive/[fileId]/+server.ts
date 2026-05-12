import { error, type RequestHandler } from '@sveltejs/kit';
import { getGoogleDriveService } from '$lib/services/google-drive-service';

export const GET: RequestHandler = async ({ params }) => {
	const { fileId } = params;
	const stream = await getGoogleDriveService().getFileStream(fileId);
	return new Response(stream, {
		headers: {
			'Content-Type': 'application/pdf',
			'Cache-Control': 'private, max-age=3600',
		},
	});
};
