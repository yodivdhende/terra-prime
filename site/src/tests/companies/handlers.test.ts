import { describe, it, expect, vi } from 'vitest';
import { mockCookies } from '../helpers/mockCookies';
import { mockRequest } from '../helpers/mockRequest';
import { createSessionRepoMock } from '../mocks/sessionRepo';

const { mockCompany, mockDiscounts } = vi.hoisted(() => ({
	mockCompany: { id: 1, name: 'Acme Corp', description: 'A corp', link: null },
	mockDiscounts: { items: [], implants: [], skills: [] },
}));

vi.mock('$lib/db/session.repo', () => ({ sessionRepo: createSessionRepoMock() }));
vi.mock('$lib/db/companies.repo', async () => ({
	companyRepo: {
		getAll: vi.fn().mockResolvedValue([mockCompany]),
		getWithId: vi.fn().mockResolvedValue(mockCompany),
		save: vi.fn().mockResolvedValue(1),
		delete: vi.fn().mockResolvedValue(undefined),
	},
	isCompany: (await import('$lib/db/companies.repo')).isCompany,
}));
vi.mock('$lib/db/company_discounts.repo', async () => ({
	companyDiscountsRepo: {
		getByCompany: vi.fn().mockResolvedValue(mockDiscounts),
		setDiscounts: vi.fn().mockResolvedValue(undefined),
	},
	isCompanyDiscounts: (await import('$lib/db/company_discounts.repo')).isCompanyDiscounts,
}));

import { GET as getCompanies, PUT as putCompany } from '../../routes/api/companies/+server';
import { GET as getCompanyById, POST as postCompanyById, DELETE as deleteCompanyById } from '../../routes/api/companies/[id]/+server';
import { GET as getDiscounts, POST as postDiscounts } from '../../routes/api/companies/[id]/discounts/+server';
import { sessionRepo } from '$lib/db/session.repo';
import { companyRepo } from '$lib/db/companies.repo';

describe('GET /api/companies', () => {
	it('returns 200 with companies list', async () => {
		const res = await getCompanies({ cookies: mockCookies('token') } as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
	});

	it('rejects without auth', async () => {
		await expect(getCompanies({ cookies: mockCookies() } as any)).rejects.toThrow();
	});
});

describe('PUT /api/companies', () => {
	it('returns 200 for a valid company body', async () => {
		const res = await putCompany({
			cookies: mockCookies('token'),
			request: mockRequest(mockCompany),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			putCompany({ cookies: mockCookies('token'), request: mockRequest({}) } as any)
		).rejects.toThrow();
	});
});

describe('GET /api/companies/[id]', () => {
	it('returns 200 with company when found', async () => {
		const res = await getCompanyById({ cookies: mockCookies('token'), params: { id: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects when company not found', async () => {
		vi.mocked(companyRepo.getWithId).mockResolvedValueOnce(null);
		await expect(
			getCompanyById({ cookies: mockCookies('token'), params: { id: '999' } } as any)
		).rejects.toThrow();
	});
});

describe('POST /api/companies/[id]', () => {
	it('returns 200 for a valid update', async () => {
		const res = await postCompanyById({
			cookies: mockCookies('token'),
			params: { id: '1' },
			request: mockRequest(mockCompany),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			postCompanyById({
				cookies: mockCookies('token'),
				params: { id: '1' },
				request: mockRequest({}),
			} as any)
		).rejects.toThrow();
	});
});

describe('DELETE /api/companies/[id]', () => {
	it('returns 200 on successful delete', async () => {
		const res = await deleteCompanyById({ cookies: mockCookies('token'), params: { id: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects without auth', async () => {
		await expect(
			deleteCompanyById({ cookies: mockCookies(), params: { id: '1' } } as any)
		).rejects.toThrow();
	});
});

describe('GET /api/companies/[id]/discounts', () => {
	it('returns 200 with discounts', async () => {
		const res = await getDiscounts({ cookies: mockCookies('token'), params: { id: '1' } } as any);
		expect(res.status).toBe(200);
	});
});

describe('POST /api/companies/[id]/discounts', () => {
	it('returns 200 for valid discounts body', async () => {
		const res = await postDiscounts({
			cookies: mockCookies('token'),
			params: { id: '1' },
			request: mockRequest(mockDiscounts),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			postDiscounts({
				cookies: mockCookies('token'),
				params: { id: '1' },
				request: mockRequest({ wrong: true }),
			} as any)
		).rejects.toThrow();
	});
});
