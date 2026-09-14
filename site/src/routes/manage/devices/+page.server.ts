import type { Device } from '$lib/types/device';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const response = await fetch('/api/devices');
	const devices: Device[] = response.ok ? await response.json() : [];
	return { devices };
};
