import { characterRepo } from '$lib/db/character.repo';
import { characterVersionRepo, isCharacterVersionSkill, isCharacterVersionItem } from '$lib/db/character_version.repo';
import { eventParticipantsRepo } from '$lib/db/event_participants.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

type CharacterDraft = {
	name: string;
	skills: { id: number; value: number }[];
	items: { id: number; count: number }[];
	implants: number[];
};

function isCharacterDraft(v: unknown): v is CharacterDraft {
	return (
		typeof v === 'object' && v !== null &&
		'name' in v && typeof (v as any).name === 'string' &&
		'skills' in v && Array.isArray((v as any).skills) && (v as any).skills.every(isCharacterVersionSkill) &&
		'items' in v && Array.isArray((v as any).items) && (v as any).items.every(isCharacterVersionItem) &&
		'implants' in v && Array.isArray((v as any).implants) && (v as any).implants.every((i: unknown) => typeof i === 'number')
	);
}

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
		const eventId = isNumberOrError(params.eventId);
		const participation = await eventParticipantsRepo.getUserParticipation({ eventId, userId });
		if (!participation) return new Response(null, { status: 204 });
		return json(participation);
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
		const eventId = isNumberOrError(params.eventId);
		const body = await request.json();
		console.log('[participants/me POST] body:', JSON.stringify(body));

		let characterVersionId: number;

		if (typeof body?.characterVersionId === 'number') {
			characterVersionId = body.characterVersionId;
		} else if (isCharacterDraft(body?.draft)) {
			const draft: CharacterDraft = body.draft;
			const characterId = await characterRepo.save({ name: draft.name, ownerId: userId });
			if (characterId == null) throw new BadRequest();
			characterVersionId = await characterVersionRepo.save({
				id: null,
				characterId,
				name: draft.name,
				skills: draft.skills,
				items: draft.items,
				implants: draft.implants
			});
		} else {
			throw new BadRequest();
		}

		await eventParticipantsRepo.participate({ eventId, userId, characterVersionId });
		return new Response(null, { status: 201 });
	});
};
