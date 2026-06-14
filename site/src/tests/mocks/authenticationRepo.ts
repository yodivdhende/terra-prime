import { vi } from 'vitest';

export const defaultAuthResult = { userId: 1, roles: ['admin' as const], name: 'Test User' };

export function createAuthRepoMock(
	result: { userId: number; roles: string[]; name: string } | null = defaultAuthResult
) {
	return {
		getCredentials: vi.fn().mockResolvedValue(result),
		register: vi.fn().mockResolvedValue(1),
	};
}
