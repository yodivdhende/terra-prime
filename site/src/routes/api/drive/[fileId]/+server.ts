import { error, type RequestHandler } from '@sveltejs/kit';
import { getGoogleDriveService } from '$lib/services/google-drive-service';

export const GET: RequestHandler = async ({ params, request }) => {
	const { fileId } = params;
	if (!fileId) throw error(400, 'missing fileId');

	const service = getGoogleDriveService();
	const rangeHeader = request.headers.get('range') ?? undefined;
	const [stream, { mimeType, size }] = await Promise.all([
		service.getFileStream(fileId, rangeHeader),
		service.getFileMetadata(fileId),
	]);

	const status = rangeHeader ? 206 : 200;
	const headers: Record<string, string> = {
		'Content-Type': mimeType,
		'Cache-Control': 'private, max-age=3600',
		'Accept-Ranges': 'bytes',
	};
	if (size) headers['Content-Length'] = String(size);
	if (rangeHeader && size) {
		const [start, end] = rangeHeader.replace('bytes=', '').split('-');
		const from = Number(start);
		const to = end ? Number(end) : size - 1;
		headers['Content-Range'] = `bytes ${from}-${to}/${size}`;
	}

	return new Response(stream, { status, headers });
};
