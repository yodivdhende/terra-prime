import { characterRepo } from '$lib/db/character.repo';
import { getGoogleDriveService } from '$lib/services/google-drive-service';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
		const characters = await characterRepo.getForUser(userId);
		const characterNames = new Set(
			(characters ?? []).map((c: { name: string }) => c.name.toLowerCase())
		);

		const driveService = getGoogleDriveService();
		const backgroundFolder = await driveService.findBackgroundFolder();
		if (!backgroundFolder) return json([]);

		const allEntries = await driveService.getFolderFiles(backgroundFolder);
		const filtered = allEntries.filter((entry: { name: string }) =>
			characterNames.has(entry.name.toLowerCase())
		);

		return json(filtered);
	});
};
