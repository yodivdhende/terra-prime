import { describe, it, expect, vi } from 'vitest';
import { mockCookies } from '../helpers/mockCookies';
import { mockRequest } from '../helpers/mockRequest';
import { createSessionRepoMock } from '../mocks/sessionRepo';

vi.mock('$lib/db/session.repo', () => ({ sessionRepo: createSessionRepoMock() }));

import { POST } from '../../routes/api/authentication/login/token/+server';

describe('POST /api/authentication/login/token', () => {
	it('returns 200 with the token when a valid token string is provided', async () => {
		const res = await POST({
			request: mockRequest({ token: 'my-existing-token' }),
			cookies: mockCookies(),
		} as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty('token', 'my-existing-token');
	});

	it('rejects when token is missing from the body', async () => {
		await expect(
			POST({
				request: mockRequest({}),
				cookies: mockCookies(),
			} as any)
		).rejects.toThrow();
	});
});
