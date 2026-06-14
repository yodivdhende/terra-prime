import { describe, it, expect, vi } from 'vitest';
import { mockCookies } from '../helpers/mockCookies';
import { mockRequest } from '../helpers/mockRequest';
import { createSessionRepoMock, playerSession } from '../mocks/sessionRepo';

const { mockUser, mockCharacter, mockVersion } = vi.hoisted(() => ({
	mockUser: { id: 1, email: 'player@test.com', name: 'Player One', verified: true },
	mockCharacter: { id: 1, name: 'Aria', ownerId: 1, ownerName: 'Player One', backstoryUrl: null },
	mockVersion: { id: 1, characterId: 1, name: 'V1', company: 1, skills: [], items: [], implants: [] },
}));

vi.mock('$lib/db/session.repo', () => ({ sessionRepo: createSessionRepoMock(playerSession) }));
vi.mock('$lib/db/user.repo', () => ({
	userRepo: { getById: vi.fn().mockResolvedValue(mockUser), getByEmail: vi.fn().mockResolvedValue(mockUser) },
}));
vi.mock('$lib/db/character.repo', async () => ({
	characterRepo: {
		getForUser: vi.fn().mockResolvedValue([mockCharacter]),
		getByOwner: vi.fn().mockResolvedValue([mockCharacter]),
		save: vi.fn().mockResolvedValue(1),
	},
	isCharacter: (await import('$lib/db/character.repo')).isCharacter,
	isNewCharacter: (await import('$lib/db/character.repo')).isNewCharacter,
}));
vi.mock('$lib/db/character_version.repo', async () => ({
	characterVersionRepo: {
		getForUser: vi.fn().mockResolvedValue([mockVersion]),
		save: vi.fn().mockResolvedValue(1),
	},
	isCharacterVersionBare: (await import('$lib/db/character_version.repo')).isCharacterVersionBare,
}));
vi.mock('$lib/db/event_participants.repo', () => ({
	eventParticipantsRepo: {
		getEventsForCharacters: vi.fn().mockResolvedValue([]),
		getUserParticipation: vi.fn().mockResolvedValue({ characterId: 1, characterVersionId: 1 }),
		participate: vi.fn().mockResolvedValue(undefined),
	},
}));
vi.mock('$lib/db/skills.repo', () => ({ skillRepo: { getAll: vi.fn().mockResolvedValue([]) } }));
vi.mock('$lib/db/items.repo', () => ({ itemRepo: { getAll: vi.fn().mockResolvedValue([]) } }));
vi.mock('$lib/db/implants.repo', () => ({ implantRepo: { getAll: vi.fn().mockResolvedValue([]) } }));
vi.mock('$lib/db/companies.repo', () => ({ companyRepo: { getAll: vi.fn().mockResolvedValue([]) } }));

import { GET as getMyUser } from '../../routes/api/my/user/+server';
import { GET as getMyCharacters } from '../../routes/api/my/characters/+server';
import { GET as getMyCharactersWithEvents } from '../../routes/api/my/characters/with-events/+server';
import { GET as getMyParticipation, PUT as putMyParticipation } from '../../routes/api/my/events/[eventId]/participants/+server';
import { sessionRepo } from '$lib/db/session.repo';
import { eventParticipantsRepo } from '$lib/db/event_participants.repo';

describe('GET /api/my/user', () => {
	it('returns 200 with the current user', async () => {
		const res = await getMyUser({ cookies: mockCookies('token') } as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty('email');
	});

	it('rejects without auth token', async () => {
		await expect(getMyUser({ cookies: mockCookies() } as any)).rejects.toThrow();
	});

	it('rejects with invalid session', async () => {
		vi.mocked(sessionRepo.getCredentials).mockResolvedValueOnce(null);
		await expect(getMyUser({ cookies: mockCookies('bad') } as any)).rejects.toThrow();
	});
});

describe('GET /api/my/characters', () => {
	it('returns 200 with the current user\'s characters', async () => {
		const res = await getMyCharacters({ cookies: mockCookies('token') } as any);
		expect(res.status).toBe(200);
	});

	it('rejects without auth', async () => {
		await expect(getMyCharacters({ cookies: mockCookies() } as any)).rejects.toThrow();
	});
});

describe('GET /api/my/characters/with-events', () => {
	it('returns 200 with characters and their events', async () => {
		const res = await getMyCharactersWithEvents({ cookies: mockCookies('token') } as any);
		expect(res.status).toBe(200);
	});
});

describe('GET /api/my/events/[eventId]/participants', () => {
	it('returns 200 with participation when found', async () => {
		const res = await getMyParticipation({
			cookies: mockCookies('token'),
			params: { eventId: '1' },
		} as any);
		expect(res.status).toBe(200);
	});

	it('returns 204 when not registered', async () => {
		vi.mocked(eventParticipantsRepo.getUserParticipation).mockResolvedValueOnce(undefined);
		const res = await getMyParticipation({
			cookies: mockCookies('token'),
			params: { eventId: '1' },
		} as any);
		expect(res.status).toBe(204);
	});

	it('rejects without auth', async () => {
		await expect(
			getMyParticipation({ cookies: mockCookies(), params: { eventId: '1' } } as any)
		).rejects.toThrow();
	});
});

describe('PUT /api/my/events/[eventId]/participants', () => {
	const validBody = {
		id: null,
		name: 'Aria',
		ownerId: 1,
		ownerName: 'Player One',
		versions: [mockVersion],
	};

	it('returns 200 for valid registration body', async () => {
		const res = await putMyParticipation({
			cookies: mockCookies('token'),
			params: { eventId: '1' },
			request: mockRequest(validBody),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			putMyParticipation({
				cookies: mockCookies('token'),
				params: { eventId: '1' },
				request: mockRequest({}),
			} as any)
		).rejects.toThrow();
	});

	it('rejects without auth', async () => {
		await expect(
			putMyParticipation({
				cookies: mockCookies(),
				params: { eventId: '1' },
				request: mockRequest(validBody),
			} as any)
		).rejects.toThrow();
	});
});
