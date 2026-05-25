import type { Actions } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, fetch }) => {
		try {
			const formData = await request.formData();
			const name = formData.get('name');
			const email = formData.get('email');
			const password = formData.get('password');
			const response = await fetch('/api/authentication/register', {
				method: 'POST',
				body: JSON.stringify({ name, email, password })
			});
			if (response.ok) {
				const { roles, userId, name } = await response.json();
				return { success: { roles, userId, name } };
			}
			const error = response.json();
			return { error };
		} catch (err) {
			return { error: err };
		}
	}
} satisfies Actions;
