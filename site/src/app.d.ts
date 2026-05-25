// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { FeatureFlags } from '$lib/server/feature-flags';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			featureFlags: FeatureFlags;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
