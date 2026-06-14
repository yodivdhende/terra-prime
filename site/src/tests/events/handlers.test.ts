import { describe, it, expect, vi } from 'vitest';
import { mockCookies } from '../helpers/mockCookies';
import { mockRequest } from '../helpers/mockRequest';
import { createSessionRepoMock, playerSession } from '../mocks/sessionRepo';

const { mockEvent, mockParticipant, mockCharacter, mockVersion } = vi.hoisted(() => ({
	mockEvent: {
		id: 1,
		name: 'Summer LARP',
		start: new Date('2026-07-01'),
		end: new Date('2026-07-03'),
		status: 'Open' as const,
	},
	mockParticipant: { eventId: 1, userId: 1, characterVersion: 1 },
	mockCharacter: { id: 1, name: 'Aria', ownerId: 1, ownerName: 'Player One', backstoryUrl: null },
	mockVersion: { id: 1, characterId: 1, name: 'V1', company: 1, skills: [], items: [], implants: [] },
}));

vi.mock('$lib/db/session.repo', () => ({ sessionRepo: createSessionRepoMock() }));
vi.mock('$lib/db/event.repo', async () => ({
	eventRepo: {
		getAll: vi.fn().mockResolvedValue([mockEvent]),
		getWithId: vi.fn().mockResolvedValue(mockEvent),
		getWithStatus: vi.fn().mockResolvedValue([mockEvent]),
		save: vi.fn().mockResolvedValue(1),
		delete: vi.fn().mockResolvedValue(undefined),
	},
	isLarpEvent: (await import('$lib/db/event.repo')).isLarpEvent,
	isStringLarpEvent: (await import('$lib/db/event.repo')).isStringLarpEvent,
}));
vi.mock('$lib/db/event_participants.repo', async () => ({
	eventParticipantsRepo: {
		getPerticipants: vi.fn().mockResolvedValue([mockCharacter]),
		getUserParticipation: vi.fn().mockResolvedValue(undefined),
		participate: vi.fn().mockResolvedValue(undefined),
		withdraw: vi.fn().mockResolvedValue(undefined),
		getParticipantForCharacter: vi.fn().mockResolvedValue(mockParticipant),
	},
	isEventParticapant: (await import('$lib/db/event_participants.repo')).isEventParticapant,
}));
vi.mock('$lib/db/character.repo', async () => ({
	characterRepo: { save: vi.fn().mockResolvedValue(1) },
	isCharacter: (await import('$lib/db/character.repo')).isCharacter,
	isNewCharacter: (await import('$lib/db/character.repo')).isNewCharacter,
}));
vi.mock('$lib/db/character_version.repo', async () => ({
	characterVersionRepo: { save: vi.fn().mockResolvedValue(1) },
	isCharacterVersionBare: (await import('$lib/db/character_version.repo')).isCharacterVersionBare,
}));

import { GET as getEvents } from '../../routes/api/events/+server';
import { GET as getOpenEvents } from '../../routes/api/events/open/+server';
import { GET as getEventById, DELETE as deleteEvent } from '../../routes/api/events/[eventId]/+server';
import { GET as getParticipants, PUT as putParticipant, DELETE as deleteParticipant } from '../../routes/api/events/[eventId]/participants/+server';
import { GET as getParticipantForCharacter } from '../../routes/api/events/[eventId]/participants/characters/[characterId]/+server';
import { sessionRepo } from '$lib/db/session.repo';
import { eventRepo } from '$lib/db/event.repo';

describe('GET /api/events', () => {
	it('returns 200 with events list for admin', async () => {
		const res = await getEvents({ cookies: mockCookies('token') } as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
	});

	it('rejects without auth', async () => {
		await expect(getEvents({ cookies: mockCookies() } as any)).rejects.toThrow();
	});

	it('rejects with invalid session', async () => {
		vi.mocked(sessionRepo.getCredentials).mockResolvedValueOnce(null);
		await expect(getEvents({ cookies: mockCookies('bad') } as any)).rejects.toThrow();
	});
});

describe('GET /api/events/open', () => {
	it('returns 200 with open events', async () => {
		const res = await getOpenEvents({ cookies: mockCookies('token') } as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
	});
});

describe('GET /api/events/[eventId]', () => {
	it('returns 200 with event when found', async () => {
		const res = await getEventById({ cookies: mockCookies('token'), params: { eventId: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects when event not found', async () => {
		vi.mocked(eventRepo.getWithId).mockResolvedValueOnce(undefined);
		await expect(
			getEventById({ cookies: mockCookies('token'), params: { eventId: '999' } } as any)
		).rejects.toThrow();
	});

	it('rejects without auth', async () => {
		await expect(
			getEventById({ cookies: mockCookies(), params: { eventId: '1' } } as any)
		).rejects.toThrow();
	});
});

describe('DELETE /api/events/[eventId]', () => {
	it('returns 200 on successful delete', async () => {
		const res = await deleteEvent({ cookies: mockCookies('token'), params: { eventId: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects without auth', async () => {
		await expect(
			deleteEvent({ cookies: mockCookies(), params: { eventId: '1' } } as any)
		).rejects.toThrow();
	});
});

describe('GET /api/events/[eventId]/participants', () => {
	it('returns 200 with participants list', async () => {
		const res = await getParticipants({ cookies: mockCookies('token'), params: { eventId: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects without auth', async () => {
		await expect(
			getParticipants({ cookies: mockCookies(), params: { eventId: '1' } } as any)
		).rejects.toThrow();
	});
});

describe('PUT /api/events/[eventId]/participants', () => {
	const validBody = {
		id: null,
		name: 'Aria',
		ownerId: 1,
		ownerName: 'Player One',
		versions: [mockVersion],
	};

	it('returns 200 for valid participant body', async () => {
		const res = await putParticipant({
			cookies: mockCookies('token'),
			params: { eventId: '1' },
			request: mockRequest(validBody),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			putParticipant({
				cookies: mockCookies('token'),
				params: { eventId: '1' },
				request: mockRequest({}),
			} as any)
		).rejects.toThrow();
	});
});

describe('DELETE /api/events/[eventId]/participants', () => {
	it('returns 200 for valid participant removal', async () => {
		const res = await deleteParticipant({
			cookies: mockCookies('token'),
			request: mockRequest(mockParticipant),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			deleteParticipant({
				cookies: mockCookies('token'),
				request: mockRequest({}),
			} as any)
		).rejects.toThrow();
	});
});

describe('GET /api/events/[eventId]/participants/characters/[characterId]', () => {
	it('returns 200 with participant record', async () => {
		vi.mocked(sessionRepo.getCredentials).mockResolvedValueOnce(playerSession);
		const res = await getParticipantForCharacter({
			cookies: mockCookies('token'),
			params: { eventId: '1', characterId: '1' },
		} as any);
		expect(res.status).toBe(200);
	});
});
