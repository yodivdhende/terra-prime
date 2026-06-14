import { describe, it, expect, vi } from 'vitest';
import { mockCookies } from '../helpers/mockCookies';
import { mockRequest } from '../helpers/mockRequest';
import { createSessionRepoMock } from '../mocks/sessionRepo';

const { mockItem } = vi.hoisted(() => ({
	mockItem: { id: 1, name: 'Sword', description: 'A sharp sword' },
}));

vi.mock('$lib/db/session.repo', () => ({ sessionRepo: createSessionRepoMock() }));
vi.mock('$lib/db/items.repo', async () => ({
	itemRepo: {
		getAll: vi.fn().mockResolvedValue([mockItem]),
		getWithId: vi.fn().mockResolvedValue(mockItem),
		save: vi.fn().mockResolvedValue(1),
		delete: vi.fn().mockResolvedValue(undefined),
	},
	isItem: (await import('$lib/db/items.repo')).isItem,
}));

import { GET as getItems, PUT as putItem } from '../../routes/api/items/+server';
import { GET as getItemById, POST as postItemById, DELETE as deleteItemById } from '../../routes/api/items/[id]/+server';
import { sessionRepo } from '$lib/db/session.repo';
import { itemRepo } from '$lib/db/items.repo';

describe('GET /api/items', () => {
	it('returns 200 with items list', async () => {
		const res = await getItems({ cookies: mockCookies('token') } as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
	});

	it('rejects without auth token', async () => {
		await expect(getItems({ cookies: mockCookies() } as any)).rejects.toThrow();
	});

	it('rejects with invalid session', async () => {
		vi.mocked(sessionRepo.getCredentials).mockResolvedValueOnce(null);
		await expect(getItems({ cookies: mockCookies('bad') } as any)).rejects.toThrow();
	});
});

describe('PUT /api/items', () => {
	it('returns 200 for a valid item body', async () => {
		const res = await putItem({
			cookies: mockCookies('token'),
			request: mockRequest(mockItem),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			putItem({ cookies: mockCookies('token'), request: mockRequest({}) } as any)
		).rejects.toThrow();
	});

	it('rejects without auth', async () => {
		await expect(
			putItem({ cookies: mockCookies(), request: mockRequest(mockItem) } as any)
		).rejects.toThrow();
	});
});

describe('GET /api/items/[id]', () => {
	it('returns 200 with item when found', async () => {
		const res = await getItemById({ cookies: mockCookies('token'), params: { id: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects when item not found', async () => {
		vi.mocked(itemRepo.getWithId).mockResolvedValueOnce(null);
		await expect(
			getItemById({ cookies: mockCookies('token'), params: { id: '999' } } as any)
		).rejects.toThrow();
	});

	it('rejects without auth', async () => {
		await expect(getItemById({ cookies: mockCookies(), params: { id: '1' } } as any)).rejects.toThrow();
	});
});

describe('POST /api/items/[id]', () => {
	it('returns 200 for a valid item update', async () => {
		const res = await postItemById({
			cookies: mockCookies('token'),
			params: { id: '1' },
			request: mockRequest(mockItem),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			postItemById({
				cookies: mockCookies('token'),
				params: { id: '1' },
				request: mockRequest({}),
			} as any)
		).rejects.toThrow();
	});
});

describe('DELETE /api/items/[id]', () => {
	it('returns 200 on successful delete', async () => {
		const res = await deleteItemById({ cookies: mockCookies('token'), params: { id: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects without auth', async () => {
		await expect(
			deleteItemById({ cookies: mockCookies(), params: { id: '1' } } as any)
		).rejects.toThrow();
	});
});
