import type { SkillGroup } from "$lib/db/skills.repo";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch }) => {
	const skillRequest = await fetch('/api/skills/groups');
	const groups: SkillGroup[] = await skillRequest.json();
	return { groups };};