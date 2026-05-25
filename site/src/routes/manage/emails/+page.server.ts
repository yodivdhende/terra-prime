import type { EmailTemplate } from '$lib/db/email_template.repo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch('/api/email-templates');
	const templates: EmailTemplate[] = await res.json();
	return { templates };
};
