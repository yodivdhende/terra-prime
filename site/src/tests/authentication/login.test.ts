import { describe, it, expect, vi } from 'vitest';
import { mockCookies } from '../helpers/mockCookies';
import { mockRequest } from '../helpers/mockRequest';
import { createSessionRepoMock } from '../mocks/sessionRepo';
import { createAuthRepoMock } from '../mocks/authenticationRepo';

vi.mock('$lib/db/session.repo', () => ({ sessionRepo: createSessionRepoMock() }));
vi.mock('$lib/db/authentication.repo', () => ({ authenticationRepo: createAuthRepoMock() }));

import { POST } from '../../routes/api/authentication/login/+server';
import { authenticationRepo } from '$lib/db/authentication.repo';

describe('POST /api/authentication/login', () => {
	it('returns 200 with token, roles, name, userId on valid credentials', async () => {
		const res = await POST({
			request: mockRequest({ email: 'test@test.com', password: 'password' }),
			cookies: mockCookies(),
		} as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty('token');
		expect(body).toHaveProperty('roles');
	});

	it('rejects when credentials are not found', async () => {
		vi.mocked(authenticationRepo.getCredentials).mockResolvedValueOnce(null);
		await expect(
			POST({
				request: mockRequest({ email: 'bad@test.com', password: 'wrong' }),
				cookies: mockCookies(),
			} as any)
		).rejects.toThrow();
	});

	it('rejects when email and password are missing', async () => {
		await expect(
			POST({
				request: mockRequest({}),
				cookies: mockCookies(),
			} as any)
		).rejects.toThrow();
	});
});
