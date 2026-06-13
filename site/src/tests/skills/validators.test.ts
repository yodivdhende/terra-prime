import { describe, it, expect } from 'vitest';
import { isSkill, isSkillGroup } from '$lib/db/skills.repo';

describe('isSkill', () => {
	it('returns false for null', () => {
		expect(isSkill(null)).toBe(false);
	});

	it('returns false for an empty object', () => {
		expect(isSkill({})).toBe(false);
	});

	it('returns false when id has wrong type', () => {
		expect(isSkill({ id: '1', name: 'Slash', description: 'A slash attack', groupId: 1, groupName: 'Combat' })).toBe(false);
	});

	it('returns false when groupId is missing', () => {
		expect(isSkill({ id: 1, name: 'Slash', description: 'A slash attack', groupName: 'Combat' })).toBe(false);
	});

	it('returns true for a valid skill with numeric id', () => {
		expect(isSkill({ id: 1, name: 'Slash', description: 'A slash attack', groupId: 1, groupName: 'Combat' })).toBe(true);
	});

	it('returns true for a new skill with null id', () => {
		expect(isSkill({ id: null, name: 'Slash', description: 'A slash attack', groupId: 1, groupName: 'Combat' })).toBe(true);
	});
});

describe('isSkillGroup', () => {
	it('returns false for null', () => {
		expect(isSkillGroup(null)).toBe(false);
	});

	it('returns false for an empty object', () => {
		expect(isSkillGroup({})).toBe(false);
	});

	it('returns false when name is missing', () => {
		expect(isSkillGroup({ id: 1, description: 'Combat skills' })).toBe(false);
	});

	it('returns true for a valid skill group', () => {
		expect(isSkillGroup({ id: 1, name: 'Combat', description: 'Combat skills' })).toBe(true);
	});

	it('returns true for a new skill group with null id', () => {
		expect(isSkillGroup({ id: null, name: 'Combat', description: 'Combat skills' })).toBe(true);
	});
});
