import { describe, it, expect, vi } from 'vitest';
import { mockCookies } from '../helpers/mockCookies';
import { mockRequest } from '../helpers/mockRequest';
import { createSessionRepoMock, adminSession } from '../mocks/sessionRepo';

const mockNewSession = {
	userId: 1,
	roles: ['user' as const],
	end: null,
	description: 'test session',
};

vi.mock('$lib/db/session.repo', async () => ({
	sessionRepo: createSessionRepoMock(),
	isNewSession: (await import('$lib/db/session.repo')).isNewSession,
}));

import { GET as getSessions, POST as postSession } from '../../routes/api/sessions/+server';
import { DELETE as deleteSession } from '../../routes/api/sessions/[token]/+server';
import { sessionRepo } from '$lib/db/session.repo';

describe('GET /api/sessions', () => {
	it('returns 200 with sessions list for admin', async () => {
		const res = await getSessions({
			request: new Request('http://localhost'),
			cookies: mockCookies('token'),
		} as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
	});

	it('rejects without auth token', async () => {
		await expect(
			getSessions({ request: new Request('http://localhost'), cookies: mockCookies() } as any)
		).rejects.toThrow();
	});

	it('rejects with invalid session', async () => {
		vi.mocked(sessionRepo.getCredentials).mockResolvedValueOnce(null);
		await expect(
			getSessions({ request: new Request('http://localhost'), cookies: mockCookies('bad') } as any)
		).rejects.toThrow();
	});
});

describe('POST /api/sessions', () => {
	it('returns 200 with new token for valid body', async () => {
		const res = await postSession({
			cookies: mockCookies('token'),
			request: mockRequest(mockNewSession),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			postSession({
				cookies: mockCookies('token'),
				request: mockRequest({ invalid: true }),
			} as any)
		).rejects.toThrow();
	});

	it('rejects without auth', async () => {
		await expect(
			postSession({
				cookies: mockCookies(),
				request: mockRequest(mockNewSession),
			} as any)
		).rejects.toThrow();
	});
});

describe('DELETE /api/sessions/[token]', () => {
	it('returns 200 on successful deletion', async () => {
		const res = await deleteSession({ cookies: mockCookies('token'), params: { token: 'some-token' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects without auth', async () => {
		await expect(
			deleteSession({ cookies: mockCookies(), params: { token: 'some-token' } } as any)
		).rejects.toThrow();
	});
});
