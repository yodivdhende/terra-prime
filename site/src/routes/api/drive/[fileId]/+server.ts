import { error, type RequestHandler } from '@sveltejs/kit';
import { getGoogleDriveService } from '$lib/services/google-drive-service';

export const GET: RequestHandler = async ({ params }) => {
	const { fileId } = params;
	if (!fileId) throw error(400, 'missing fileId');
	const service = getGoogleDriveService();
	const [stream, mimeType] = await Promise.all([
		service.getFileStream(fileId),
		service.getFileMimeType(fileId),
	]);
	return new Response(stream, {
		headers: {
			'Content-Type': mimeType,
			'Cache-Control': 'private, max-age=3600',
		},
	});
};
