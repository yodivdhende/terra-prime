import { describe, it, expect, vi } from 'vitest';
import { mockCookies } from '../helpers/mockCookies';
import { mockRequest } from '../helpers/mockRequest';
import { createSessionRepoMock } from '../mocks/sessionRepo';

const { mockTemplate } = vi.hoisted(() => ({
	mockTemplate: { id: 1, key: 'welcome', docUrl: 'https://docs.google.com/document/d/abc/edit' },
}));

vi.mock('$lib/db/session.repo', () => ({ sessionRepo: createSessionRepoMock() }));
vi.mock('$lib/db/email_template.repo', async () => ({
	emailTemplateRepo: {
		getAll: vi.fn().mockResolvedValue([mockTemplate]),
		getById: vi.fn().mockResolvedValue(mockTemplate),
		save: vi.fn().mockResolvedValue(1),
		delete: vi.fn().mockResolvedValue(undefined),
	},
	isEmailTemplate: (await import('$lib/db/email_template.repo')).isEmailTemplate,
}));

import { GET as getTemplates, PUT as putTemplate } from '../../routes/api/email-templates/+server';
import { GET as getTemplateById, POST as postTemplateById, DELETE as deleteTemplateById } from '../../routes/api/email-templates/[id]/+server';
import { sessionRepo } from '$lib/db/session.repo';
import { emailTemplateRepo } from '$lib/db/email_template.repo';

describe('GET /api/email-templates', () => {
	it('returns 200 with templates list for admin', async () => {
		const res = await getTemplates({ cookies: mockCookies('token') } as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
	});

	it('rejects without auth', async () => {
		await expect(getTemplates({ cookies: mockCookies() } as any)).rejects.toThrow();
	});

	it('rejects with invalid session', async () => {
		vi.mocked(sessionRepo.getCredentials).mockResolvedValueOnce(null);
		await expect(getTemplates({ cookies: mockCookies('bad') } as any)).rejects.toThrow();
	});
});

describe('PUT /api/email-templates', () => {
	it('returns 200 for a valid template body', async () => {
		const res = await putTemplate({
			cookies: mockCookies('token'),
			request: mockRequest(mockTemplate),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			putTemplate({ cookies: mockCookies('token'), request: mockRequest({}) } as any)
		).rejects.toThrow();
	});
});

describe('GET /api/email-templates/[id]', () => {
	it('returns 200 with template when found', async () => {
		const res = await getTemplateById({ cookies: mockCookies('token'), params: { id: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects when template not found', async () => {
		vi.mocked(emailTemplateRepo.getById).mockResolvedValueOnce(null);
		await expect(
			getTemplateById({ cookies: mockCookies('token'), params: { id: '999' } } as any)
		).rejects.toThrow();
	});
});

describe('POST /api/email-templates/[id]', () => {
	it('returns 200 for a valid update', async () => {
		const res = await postTemplateById({
			cookies: mockCookies('token'),
			params: { id: '1' },
			request: mockRequest(mockTemplate),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			postTemplateById({
				cookies: mockCookies('token'),
				params: { id: '1' },
				request: mockRequest({}),
			} as any)
		).rejects.toThrow();
	});
});

describe('DELETE /api/email-templates/[id]', () => {
	it('returns 200 on successful delete', async () => {
		const res = await deleteTemplateById({ cookies: mockCookies('token'), params: { id: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects without auth', async () => {
		await expect(
			deleteTemplateById({ cookies: mockCookies(), params: { id: '1' } } as any)
		).rejects.toThrow();
	});
});
