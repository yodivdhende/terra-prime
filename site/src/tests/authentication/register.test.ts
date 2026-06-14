import { describe, it, expect, vi } from 'vitest';
import { mockCookies } from '../helpers/mockCookies';
import { mockRequest } from '../helpers/mockRequest';
import { createSessionRepoMock } from '../mocks/sessionRepo';
import { createAuthRepoMock } from '../mocks/authenticationRepo';

vi.mock('$lib/db/session.repo', () => ({ sessionRepo: createSessionRepoMock() }));
vi.mock('$lib/db/authentication.repo', () => ({ authenticationRepo: createAuthRepoMock() }));
vi.mock('$lib/server/verification.service', () => ({ sendVerificationEmail: vi.fn().mockResolvedValue(undefined) }));

import { POST } from '../../routes/api/authentication/register/+server';

const validBody = { name: 'Alice', email: 'alice@test.com', password: 'password123' };

describe('POST /api/authentication/register', () => {
	it('returns 200 with userId and roles when registration is enabled', async () => {
		const res = await POST({
			request: mockRequest(validBody),
			cookies: mockCookies(),
			locals: { featureFlags: { Register: true } },
		} as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty('userId');
		expect(body).toHaveProperty('roles');
	});

	it('rejects with 403 when registration is disabled', async () => {
		await expect(
			POST({
				request: mockRequest(validBody),
				cookies: mockCookies(),
				locals: { featureFlags: { Register: false } },
			} as any)
		).rejects.toThrow();
	});

	it('rejects when required fields are missing', async () => {
		await expect(
			POST({
				request: mockRequest({}),
				cookies: mockCookies(),
				locals: { featureFlags: { Register: true } },
			} as any)
		).rejects.toThrow();
	});
});
