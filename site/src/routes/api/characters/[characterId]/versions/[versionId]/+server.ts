import { characterVersionRepo } from '$lib/db/character_version.repo';
import { companyRepo } from '$lib/db/companies.repo';
import { implantRepo } from '$lib/db/implants.repo';
import { itemRepo } from '$lib/db/items.repo';
import { expertiseRepo } from '$lib/db/expertise.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';
import type {
	CharacterVersionFull,
	VersionImplant,
	VersionItem,
	VersionExpertise
} from '../../../../my/characters/versions/+server';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		const versionId = isNumberOrError(params.versionId);
		const [bare, expertise, items, implants, companies] = await Promise.all([
			characterVersionRepo.getWithId(versionId),
			expertiseRepo.getAll(),
			itemRepo.getAll(),
			implantRepo.getAll(),
			companyRepo.getAll()
		]);
		if (!bare) throw new NotFoundRequest();

		const expertiseById = new Map(expertise.flatMap((e) => (e.id == null ? [] : [[e.id, e] as const])));
		const itemById = new Map(items.flatMap((i) => (i.id == null ? [] : [[i.id, i] as const])));
		const implantById = new Map(
			implants.flatMap((i) => (i.id == null ? [] : [[i.id, i] as const]))
		);
		const companyById = new Map(
			companies.flatMap((c) => (c.id == null ? [] : [[c.id, c] as const]))
		);

		const full: CharacterVersionFull = {
			id: bare.id,
			characterId: bare.characterId,
			name: bare.name,
			company: bare.company != null ? (companyById.get(bare.company) ?? null) : null,
			expertise: bare.expertise.flatMap((e): VersionExpertise[] => {
				const expertise = expertiseById.get(e.id);
				if (!expertise) return [];
				return [{ id: e.id, name: expertise.name, group: expertise.groupId, groupName: expertise.groupName, value: e.value }];
			}),
			items: bare.items.flatMap((i): VersionItem[] => {
				const item = itemById.get(i.id);
				if (!item) return [];
				return [{ id: i.id, name: item.name, description: item.description, count: i.count }];
			}),
			implants: bare.implants.flatMap((vi): VersionImplant[] => {
				const implant = implantById.get(vi.id);
				if (!implant) return [];
				return [{ id: vi.id, name: implant.name, description: implant.description, slot: vi.slot }];
			}),
			events: []
		};
		return json(full);
	});
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), [UserRole.admin]);
		const versionId = isNumberOrError(params.versionId);
		const body: CharacterVersionFull = await request.json();
		if (body.company?.id == null) throw new BadRequest();
		await characterVersionRepo.update({
			id: versionId,
			characterId: body.characterId,
			name: body.name,
			company: body.company.id,
			expertise: body.expertise.map((e: VersionExpertise) => ({ id: e.id, value: e.value })),
			items: body.items.map((i: VersionItem) => ({ id: i.id, count: i.count })),
			implants: body.implants.map((i) => ({ id: i.id, slot: i.slot }))
		});
		return new Response(null, { status: 200 });
	});
};
