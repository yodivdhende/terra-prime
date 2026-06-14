import { describe, it, expect, vi } from 'vitest';
import { mockCookies } from '../helpers/mockCookies';
import { mockRequest } from '../helpers/mockRequest';
import { createSessionRepoMock } from '../mocks/sessionRepo';

const { mockSkill, mockGroup } = vi.hoisted(() => ({
	mockSkill: { id: 1, name: 'Slash', description: 'A slash attack', groupId: 1, groupName: 'Combat' },
	mockGroup: { id: 1, name: 'Combat', description: 'Combat skills' },
}));

vi.mock('$lib/db/session.repo', () => ({ sessionRepo: createSessionRepoMock() }));
vi.mock('$lib/db/skills.repo', async () => ({
	skillRepo: {
		getAll: vi.fn().mockResolvedValue([mockSkill]),
		getWithId: vi.fn().mockResolvedValue(mockSkill),
		save: vi.fn().mockResolvedValue(1),
		delete: vi.fn().mockResolvedValue(undefined),
		getAllGroups: vi.fn().mockResolvedValue([mockGroup]),
		getGroupWithId: vi.fn().mockResolvedValue(mockGroup),
		saveSkillGroup: vi.fn().mockResolvedValue(1),
		deleteSkillGroup: vi.fn().mockResolvedValue(undefined),
	},
	isSkill: (await import('$lib/db/skills.repo')).isSkill,
	isSkillGroup: (await import('$lib/db/skills.repo')).isSkillGroup,
}));

import { GET as getSkills, PUT as putSkill } from '../../routes/api/skills/+server';
import { GET as getSkillById, POST as postSkillById, DELETE as deleteSkillById } from '../../routes/api/skills/[id]/+server';
import { GET as getGroups, PUT as putGroup } from '../../routes/api/skills/groups/+server';
import { GET as getGroupById, POST as postGroupById, DELETE as deleteGroupById } from '../../routes/api/skills/groups/[id]/+server';
import { sessionRepo } from '$lib/db/session.repo';
import { skillRepo } from '$lib/db/skills.repo';

describe('GET /api/skills', () => {
	it('returns 200 with skills list for admin', async () => {
		const res = await getSkills({ cookies: mockCookies('token') } as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
	});

	it('rejects without auth token', async () => {
		await expect(getSkills({ cookies: mockCookies() } as any)).rejects.toThrow();
	});

	it('rejects with invalid session', async () => {
		vi.mocked(sessionRepo.getCredentials).mockResolvedValueOnce(null);
		await expect(getSkills({ cookies: mockCookies('bad') } as any)).rejects.toThrow();
	});
});

describe('PUT /api/skills', () => {
	it('returns 200 for a valid skill body', async () => {
		const res = await putSkill({
			cookies: mockCookies('token'),
			request: mockRequest(mockSkill),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body with BadRequest', async () => {
		await expect(
			putSkill({ cookies: mockCookies('token'), request: mockRequest({}) } as any)
		).rejects.toThrow();
	});

	it('rejects without auth', async () => {
		await expect(
			putSkill({ cookies: mockCookies(), request: mockRequest(mockSkill) } as any)
		).rejects.toThrow();
	});
});

describe('GET /api/skills/[id]', () => {
	it('returns 200 with skill when found', async () => {
		const res = await getSkillById({ cookies: mockCookies('token'), params: { id: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects with NotFoundRequest when skill not found', async () => {
		vi.mocked(skillRepo.getWithId).mockResolvedValueOnce(null);
		await expect(
			getSkillById({ cookies: mockCookies('token'), params: { id: '999' } } as any)
		).rejects.toThrow();
	});

	it('rejects without auth', async () => {
		await expect(getSkillById({ cookies: mockCookies(), params: { id: '1' } } as any)).rejects.toThrow();
	});
});

describe('POST /api/skills/[id]', () => {
	it('returns 200 for a valid skill update', async () => {
		const res = await postSkillById({
			cookies: mockCookies('token'),
			params: { id: '1' },
			request: mockRequest(mockSkill),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			postSkillById({
				cookies: mockCookies('token'),
				params: { id: '1' },
				request: mockRequest({}),
			} as any)
		).rejects.toThrow();
	});
});

describe('DELETE /api/skills/[id]', () => {
	it('returns 200 on successful delete', async () => {
		const res = await deleteSkillById({ cookies: mockCookies('token'), params: { id: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects without auth', async () => {
		await expect(
			deleteSkillById({ cookies: mockCookies(), params: { id: '1' } } as any)
		).rejects.toThrow();
	});
});

describe('GET /api/skills/groups', () => {
	it('returns 200 with groups list', async () => {
		const res = await getGroups({ cookies: mockCookies('token') } as any);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
	});

	it('rejects without auth', async () => {
		await expect(getGroups({ cookies: mockCookies() } as any)).rejects.toThrow();
	});
});

describe('PUT /api/skills/groups', () => {
	it('returns 200 for a valid skill group', async () => {
		const res = await putGroup({
			cookies: mockCookies('token'),
			request: mockRequest(mockGroup),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			putGroup({ cookies: mockCookies('token'), request: mockRequest({}) } as any)
		).rejects.toThrow();
	});
});

describe('GET /api/skills/groups/[id]', () => {
	it('returns 200 when group found', async () => {
		const res = await getGroupById({ cookies: mockCookies('token'), params: { id: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects when group not found', async () => {
		vi.mocked(skillRepo.getGroupWithId).mockResolvedValueOnce(null);
		await expect(
			getGroupById({ cookies: mockCookies('token'), params: { id: '999' } } as any)
		).rejects.toThrow();
	});
});

describe('POST /api/skills/groups/[id]', () => {
	it('returns 200 for a valid update', async () => {
		const res = await postGroupById({
			cookies: mockCookies('token'),
			params: { id: '1' },
			request: mockRequest(mockGroup),
		} as any);
		expect(res.status).toBe(200);
	});

	it('rejects invalid body', async () => {
		await expect(
			postGroupById({
				cookies: mockCookies('token'),
				params: { id: '1' },
				request: mockRequest({}),
			} as any)
		).rejects.toThrow();
	});
});

describe('DELETE /api/skills/groups/[id]', () => {
	it('returns 200 on successful delete', async () => {
		const res = await deleteGroupById({ cookies: mockCookies('token'), params: { id: '1' } } as any);
		expect(res.status).toBe(200);
	});

	it('rejects without auth', async () => {
		await expect(
			deleteGroupById({ cookies: mockCookies(), params: { id: '1' } } as any)
		).rejects.toThrow();
	});
});
