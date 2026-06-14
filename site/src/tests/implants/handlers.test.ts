import { describe, it, expect, vi } from 'vitest';
import { mockCookies } from '../helpers/mockCookies';
import { mockRequest } from '../helpers/mockRequest';
import { createSessionRepoMock } from '../mocks/sessionRepo';

const { mockImplant } = vi.hoisted(() => ({
	mockImplant: { id: 1, name: 'Neural Chip', description: 'A neural implant' },
}));

vi.mock('$lib/db/session.repo', () => ({ sessionRepo: createSessionRepoMock() }));
vi.mock('$lib/db/implants.repo', async () => ({
	implantRepo: {
		getAll: vi.fn().mockResolvedValue([mockImplant]),
		getWithId: vi.fn().mockResolvedValue(mockImplant),
		save: vi.fn().mockResolvedValue(1),
		delete: vi.fn().mockResolvedValue(undefined),
	},
	isImplants: (await import('$lib/db/implants.repo')).isImplants,
}));

import { GET as getImplants, PUT as putImplant } from '../../routes/api/implants/+server';
import { GET as getImplantById, POST as postImplantById, DELETE as deleteImplantById } from '../../routes/api/implants/[id]/+server';
import { sessionRepo } from '$lib/db/session.repo';
import { implantRepo } from '$lib/db/implants.repo';

describe('GET /api/implants', () => {
	it('returns 200 with implants list', async () => {
		const res = await getImplants({ cookies: mockCookies('token') } as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
	});

	it('rejects without auth token', async () => {
		await expect(getImplants({ cookies: mockCookies() } as any)).rejects.toThrow();
	});

	it('rejects with invalid session', async () => {
		vi.mocked(sessionRepo.getCredentials).mockResolvedValueOnce(null);
		await expect(getImplants({ cookies: mockCookies('bad') } as any)).rejects.toThrow();
	});
});

describe('PUT /api/implants', () => {
	it('returns 200 for a valid implant body', async () => {
		const res = await putImplant({
			cookies: mockCookies('token'),
			request: mockRequest(mockImplant),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			putImplant({ cookies: mockCookies('token'), request: mockRequest({}) } as any)
		).rejects.toThrow();
	});

	it('rejects without auth', async () => {
		await expect(
			putImplant({ cookies: mockCookies(), request: mockRequest(mockImplant) } as any)
		).rejects.toThrow();
	});
});

describe('GET /api/implants/[id]', () => {
	it('returns 200 with implant when found', async () => {
		const res = await getImplantById({ cookies: mockCookies('token'), params: { id: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects when implant not found', async () => {
		vi.mocked(implantRepo.getWithId).mockResolvedValueOnce(null);
		await expect(
			getImplantById({ cookies: mockCookies('token'), params: { id: '999' } } as any)
		).rejects.toThrow();
	});

	it('rejects without auth', async () => {
		await expect(
			getImplantById({ cookies: mockCookies(), params: { id: '1' } } as any)
		).rejects.toThrow();
	});
});

describe('POST /api/implants/[id]', () => {
	it('returns 200 for a valid implant update', async () => {
		const res = await postImplantById({
			cookies: mockCookies('token'),
			params: { id: '1' },
			request: mockRequest(mockImplant),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			postImplantById({
				cookies: mockCookies('token'),
				params: { id: '1' },
				request: mockRequest({}),
			} as any)
		).rejects.toThrow();
	});
});

describe('DELETE /api/implants/[id]', () => {
	it('returns 200 on successful delete', async () => {
		const res = await deleteImplantById({ cookies: mockCookies('token'), params: { id: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects without auth', async () => {
		await expect(
			deleteImplantById({ cookies: mockCookies(), params: { id: '1' } } as any)
		).rejects.toThrow();
	});
});
