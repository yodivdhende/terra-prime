import { describe, it, expect, vi } from 'vitest';
import { mockCookies } from '../helpers/mockCookies';
import { mockRequest } from '../helpers/mockRequest';
import { createSessionRepoMock, playerSession } from '../mocks/sessionRepo';

const { mockCharacter, mockVersion } = vi.hoisted(() => ({
	mockCharacter: { id: 1, name: 'Aria', ownerId: 1, ownerName: 'Player One', backstoryUrl: null },
	mockVersion: { id: 1, characterId: 1, name: 'Version 1', company: 1, skills: [], items: [], implants: [] },
}));

const mockNewCharacter = { name: 'Aria', ownerId: 1 };

vi.mock('$lib/db/session.repo', () => ({ sessionRepo: createSessionRepoMock() }));
vi.mock('$lib/db/character.repo', async () => ({
	characterRepo: {
		getAll: vi.fn().mockResolvedValue([mockCharacter]),
		getById: vi.fn().mockResolvedValue(mockCharacter),
		save: vi.fn().mockResolvedValue(1),
		getForUser: vi.fn().mockResolvedValue([mockCharacter]),
		getByOwner: vi.fn().mockResolvedValue([mockCharacter]),
	},
	isCharacter: (await import('$lib/db/character.repo')).isCharacter,
	isNewCharacter: (await import('$lib/db/character.repo')).isNewCharacter,
}));
vi.mock('$lib/db/character_version.repo', async () => ({
	characterVersionRepo: {
		getAllWithCharacterName: vi.fn().mockResolvedValue([]),
		getWithId: vi.fn().mockResolvedValue(mockVersion),
		getForCharacter: vi.fn().mockResolvedValue([mockVersion]),
		save: vi.fn().mockResolvedValue(1),
		create: vi.fn().mockResolvedValue(1),
		saveSkills: vi.fn().mockResolvedValue(undefined),
		getForUser: vi.fn().mockResolvedValue([mockVersion]),
	},
	isCharacterVersionBare: (await import('$lib/db/character_version.repo')).isCharacterVersionBare,
	isCharacterVersionSkill: (await import('$lib/db/character_version.repo')).isCharacterVersionSkill,
}));
vi.mock('$lib/db/skills.repo', () => ({ skillRepo: { getAll: vi.fn().mockResolvedValue([]) } }));
vi.mock('$lib/db/items.repo', () => ({ itemRepo: { getAll: vi.fn().mockResolvedValue([]) } }));
vi.mock('$lib/db/implants.repo', () => ({ implantRepo: { getAll: vi.fn().mockResolvedValue([]) } }));
vi.mock('$lib/db/companies.repo', () => ({ companyRepo: { getAll: vi.fn().mockResolvedValue([{ id: 1, name: 'Test Corp' }]) } }));
vi.mock('$lib/db/event_participants.repo', () => ({
	eventParticipantsRepo: {
		getParticipantForCharacter: vi.fn().mockResolvedValue({ eventId: 1, userId: 1, characterVersion: 1 }),
	},
}));

import { GET as getCharacters, PUT as putCharacter } from '../../routes/api/characters/+server';
import { GET as getCharacterById, POST as postCharacterById } from '../../routes/api/characters/[characterId]/+server';
import { GET as getVersions, PUT as putVersion } from '../../routes/api/characters/versions/+server';
import { GET as getVersionById, PUT as putVersionById } from '../../routes/api/characters/versions/[versionId]/+server';
import { PUT as putVersionSkills } from '../../routes/api/characters/versions/[versionId]/skills/+server';
import { GET as getCharacterVersions, PUT as putCharacterVersion } from '../../routes/api/characters/[characterId]/versions/+server';
import { sessionRepo } from '$lib/db/session.repo';

describe('GET /api/characters', () => {
	it('returns 200 with characters list for admin', async () => {
		const res = await getCharacters({ cookies: mockCookies('token') } as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
	});

	it('rejects without auth', async () => {
		await expect(getCharacters({ cookies: mockCookies() } as any)).rejects.toThrow();
	});
});

describe('PUT /api/characters', () => {
	it('returns 200 with id when creating a valid character', async () => {
		const res = await putCharacter({
			cookies: mockCookies('token'),
			request: mockRequest(mockNewCharacter),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			putCharacter({ cookies: mockCookies('token'), request: mockRequest({}) } as any)
		).rejects.toThrow();
	});
});

describe('GET /api/characters/[characterId]', () => {
	it('returns 200 with character when found', async () => {
		const res = await getCharacterById({
			cookies: mockCookies('token'),
			params: { characterId: '1' },
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects without auth', async () => {
		await expect(
			getCharacterById({ cookies: mockCookies(), params: { characterId: '1' } } as any)
		).rejects.toThrow();
	});
});

describe('POST /api/characters/[characterId]', () => {
	it('returns 200 for a valid character update', async () => {
		const res = await postCharacterById({
			cookies: mockCookies('token'),
			params: { id: '1', characterId: '1' },
			request: mockRequest(mockCharacter),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			postCharacterById({
				cookies: mockCookies('token'),
				params: { id: '1', characterId: '1' },
				request: mockRequest({}),
			} as any)
		).rejects.toThrow();
	});
});

describe('GET /api/characters/versions', () => {
	it('returns 200 with versions list for admin', async () => {
		const res = await getVersions({ cookies: mockCookies('token') } as any);
		expect(res.status).toBe(200);
	});

	it('rejects without auth', async () => {
		await expect(getVersions({ cookies: mockCookies() } as any)).rejects.toThrow();
	});
});

describe('PUT /api/characters/versions', () => {
	it('returns 200 with id when creating a valid version', async () => {
		vi.mocked(sessionRepo.getCredentials).mockResolvedValueOnce(playerSession);
		const res = await putVersion({
			cookies: mockCookies('token'),
			request: mockRequest(mockVersion),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		vi.mocked(sessionRepo.getCredentials).mockResolvedValueOnce(playerSession);
		await expect(
			putVersion({ cookies: mockCookies('token'), request: mockRequest({}) } as any)
		).rejects.toThrow();
	});
});

describe('GET /api/characters/versions/[versionId]', () => {
	it('returns 200 when version found', async () => {
		const res = await getVersionById({
			cookies: mockCookies('token'),
			params: { versionId: '1' },
		} as any);
		expect(res.status).toBe(200);
	});
});

describe('PUT /api/characters/versions/[versionId]', () => {
	it('returns 200 for valid version update', async () => {
		vi.mocked(sessionRepo.getCredentials).mockResolvedValueOnce(playerSession);
		const res = await putVersionById({
			cookies: mockCookies('token'),
			params: { versionId: '1' },
			request: mockRequest(mockVersion),
		} as any);
		expect(res.status).toBe(200);
	});
});

describe('PUT /api/characters/versions/[versionId]/skills', () => {
	it('returns 200 for a valid skills array', async () => {
		vi.mocked(sessionRepo.getCredentials).mockResolvedValueOnce(playerSession);
		const res = await putVersionSkills({
			cookies: mockCookies('token'),
			params: { versionId: '1' },
			request: mockRequest([{ id: 1, value: 5 }]),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body (not an array)', async () => {
		vi.mocked(sessionRepo.getCredentials).mockResolvedValueOnce(playerSession);
		await expect(
			putVersionSkills({
				cookies: mockCookies('token'),
				params: { versionId: '1' },
				request: mockRequest({ id: 1 }),
			} as any)
		).rejects.toThrow();
	});
});

describe('GET /api/characters/[characterId]/versions', () => {
	it('returns 200 with versions for the character', async () => {
		const res = await getCharacterVersions({
			cookies: mockCookies('token'),
			params: { characterId: '1' },
		} as any);
		expect(res.status).toBe(200);
	});
});

describe('PUT /api/characters/[characterId]/versions', () => {
	it('returns 200 when creating a version for a character', async () => {
		const res = await putCharacterVersion({
			cookies: mockCookies('token'),
			params: { characterId: '1' },
		} as any);
		expect(res.status).toBe(200);
	});
});
