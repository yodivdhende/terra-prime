import { characterRepo, type Character } from '$lib/db/character.repo';
import type { PageServerLoad } from './$types';
import { userRepo } from '$lib/db/user.repo';
import { handleRequest } from '$lib/utils/request';
import { RequestError } from '$lib/types/errors';

export const load: PageServerLoad = async ({ params }) => {
	return handleRequest(async () => {
		const character = await getCharacter(params.id);
		if (character == null) return new RequestError(404, 'Not found!');
		return {
			character,
			users: await userRepo.getAll()
		};
	});
};

async function getCharacter(id: any): Promise<Character | undefined> {
	if (id == null || typeof id != 'string') return;
	const idNumber = parseInt(id);
	if (Number.isNaN(idNumber)) return;
	return characterRepo.getById(idNumber);
}
