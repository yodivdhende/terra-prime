import { describe, it, expect, vi } from 'vitest';
import { mockCookies } from '../helpers/mockCookies';
import { mockRequest } from '../helpers/mockRequest';
import { createSessionRepoMock } from '../mocks/sessionRepo';

const { mockUser } = vi.hoisted(() => ({
	mockUser: { id: 1, email: 'test@test.com', name: 'Test User', verified: true },
}));

vi.mock('$lib/db/session.repo', () => ({ sessionRepo: createSessionRepoMock() }));
vi.mock('$lib/db/user.repo', async () => ({
	userRepo: {
		getAll: vi.fn().mockResolvedValue([mockUser]),
		getById: vi.fn().mockResolvedValue(mockUser),
		update: vi.fn().mockResolvedValue(undefined),
	},
	isUser: (await import('$lib/db/user.repo')).isUser,
}));

import { GET as getUsers } from '../../routes/api/users/+server';
import { GET as getUserById, POST as postUserById } from '../../routes/api/users/[id]/+server';
import { sessionRepo } from '$lib/db/session.repo';

describe('GET /api/users', () => {
	it('returns 200 with users list for admin', async () => {
		const res = await getUsers({ cookies: mockCookies('token') } as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
	});

	it('rejects without auth token', async () => {
		await expect(getUsers({ cookies: mockCookies() } as any)).rejects.toThrow();
	});

	it('rejects with invalid session', async () => {
		vi.mocked(sessionRepo.getCredentials).mockResolvedValueOnce(null);
		await expect(getUsers({ cookies: mockCookies('bad') } as any)).rejects.toThrow();
	});
});

describe('GET /api/users/[id]', () => {
	it('returns 200 with user when found', async () => {
		const res = await getUserById({ cookies: mockCookies('token'), params: { id: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects without auth', async () => {
		await expect(getUserById({ cookies: mockCookies(), params: { id: '1' } } as any)).rejects.toThrow();
	});
});

describe('POST /api/users/[id]', () => {
	it('returns 200 for a valid user update', async () => {
		const res = await postUserById({
			cookies: mockCookies('token'),
			params: { id: '1' },
			request: mockRequest(mockUser),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			postUserById({
				cookies: mockCookies('token'),
				params: { id: '1' },
				request: mockRequest({ email: 'no-id@test.com' }),
			} as any)
		).rejects.toThrow();
	});

	it('rejects without auth', async () => {
		await expect(
			postUserById({
				cookies: mockCookies(),
				params: { id: '1' },
				request: mockRequest(mockUser),
			} as any)
		).rejects.toThrow();
	});
});
