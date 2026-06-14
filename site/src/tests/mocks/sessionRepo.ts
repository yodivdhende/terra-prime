import type { UserRole } from '$lib/types/roles';
import { vi } from 'vitest';

export type MockSession = { userId: number; roles: UserRole[] };

export const adminSession: MockSession = { userId: 1, roles: ['admin'] };
export const playerSession: MockSession = { userId: 2, roles: ['user'] };

export function createSessionRepoMock(session: MockSession | null = adminSession) {
	return {
		getCredentials: vi.fn().mockResolvedValue(session),
		create: vi.fn().mockResolvedValue('test-token-abc'),
		delete: vi.fn().mockResolvedValue(undefined),
		getAll: vi.fn().mockResolvedValue([]),
	};
}
