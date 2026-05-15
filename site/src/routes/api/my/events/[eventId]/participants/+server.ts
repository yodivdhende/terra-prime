import { characterRepo } from '$lib/db/character.repo';
import { characterVersionRepo, isCharacterVersionSkill, isCharacterVersionItem } from '$lib/db/character_version.repo';
import { eventParticipantsRepo } from '$lib/db/event_participants.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NoAccesRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

type CharacterDraftVersion = {
	id: number | null;
	name: string;
	skills: { id: number; value: number }[];
	items: { id: number; count: number }[];
	implants: number[];
};

type CharacterDraft = {
	id: number | null;
	name: string;
	version: CharacterDraftVersion;
};

function isCharacterDraftVersion(v: unknown): v is CharacterDraftVersion {
	return (
		typeof v === 'object' && v !== null &&
		'id' in v && ((v as any).id === null || typeof (v as any).id === 'number') &&
		'name' in v && typeof (v as any).name === 'string' &&
		'skills' in v && Array.isArray((v as any).skills) && (v as any).skills.every(isCharacterVersionSkill) &&
		'items' in v && Array.isArray((v as any).items) && (v as any).items.every(isCharacterVersionItem) &&
		'implants' in v && Array.isArray((v as any).implants) && (v as any).implants.every((i: unknown) => typeof i === 'number')
	);
}

function isCharacterDraft(v: unknown): v is CharacterDraft {
	return (
		typeof v === 'object' && v !== null &&
		'id' in v && ((v as any).id === null || typeof (v as any).id === 'number') &&
		'name' in v && typeof (v as any).name === 'string' &&
		'version' in v && isCharacterDraftVersion((v as any).version)
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

		if (!isCharacterDraft(body?.draft)) throw new BadRequest();
		const draft: CharacterDraft = body.draft;

		// --- character ---
		let characterId: number;
		if (draft.id == null) {
			const characterName = draft.name.trim() || draft.version.name;
			const newId = await characterRepo.save({ name: characterName, ownerId: userId });
			if (newId == null) throw new BadRequest();
			characterId = newId;
		} else {
			const existingChar = await characterRepo.getById(draft.id);
			if (existingChar.ownerId !== userId) throw new NoAccesRequest();
			if (draft.name && existingChar.name !== draft.name) {
				await characterRepo.save({
					id: existingChar.id,
					name: draft.name,
					ownerId: existingChar.ownerId,
					ownerName: existingChar.ownerName,
				});
			}
			characterId = draft.id;
		}

		// --- version ---
		let characterVersionId: number;
		if (draft.version.id == null) {
			characterVersionId = await characterVersionRepo.save({
				id: null,
				characterId,
				name: draft.version.name,
				skills: draft.version.skills,
				items: draft.version.items,
				implants: draft.version.implants,
			});
		} else {
			const existingVer = await characterVersionRepo.getWithId(draft.version.id);
			if (!existingVer || existingVer.characterId !== characterId) throw new NoAccesRequest();
			characterVersionId = await characterVersionRepo.save({
				id: draft.version.id,
				characterId,
				name: draft.version.name,
				skills: draft.version.skills,
				items: draft.version.items,
				implants: draft.version.implants,
			});
		}

		await eventParticipantsRepo.participate({ eventId, userId, characterVersionId });
		return new Response(null, { status: 201 });
	});
};
