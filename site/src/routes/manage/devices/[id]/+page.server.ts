import type { Device } from '$lib/types/device';
import { handleRequest } from '$lib/utils/request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	return handleRequest(async () => {
		const response = await fetch(`/api/devices/${params.id}`);
		const device: Device | undefined = response.ok ? await response.json() : undefined;
		return { device };
	});
};
