import { type Skill } from '$lib/db/skills.repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const skillRequest = await fetch('/api/skills');
	const skills: Skill[] = await skillRequest.json();
	return { skills };
};
