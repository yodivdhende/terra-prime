import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	VITE_GOOGLE_CLIENT_EMAIL: {
		static: true,
		description: 'Google service account client email'
	},
	VITE_GOOGLE_PRIVATE_KEY: {
		static: true,
		description: 'Google service account private key'
	},
	VITE_GOOGLE_EMAIL_SUBJECT: {
		static: true,
		description: 'Mailbox the Gmail service account impersonates'
	},
	PUBLIC_BASE_URL: {
		public: true,
		static: true,
		description: 'Public base URL of the site, used in e-mailed links'
	},
	PLATFORM: {
		schema: (value) => value,
		description: 'Deployment platform for feature flags (defaults to `dev`)'
	}
});
