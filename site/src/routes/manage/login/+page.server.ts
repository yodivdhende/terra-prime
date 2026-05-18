import type { Actions } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, fetch }) => {
		try {
			const formdata = await request.formData();
			const email = formdata.get('email');
			const password = formdata.get('password');
			const response = await fetch('/api/authentication/login', {
				method: 'POST',
				body: JSON.stringify({ email, password })
			});
			if (response.ok) {
				const { roles, name, userId } = await response.json();
				return { success: { roles, name, userId } };
			}
            const error = await response.json();
			return { error };
		} catch (err) {
			return { error: err };
		}
	}
} satisfies Actions;
