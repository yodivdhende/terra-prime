import { json, type RequestHandler } from '@sveltejs/kit';
import { getGoogleFormService } from '$lib/services/google-form-service';

export const POST: RequestHandler = async ({ params, request }) => {
	const { formId } = params;
	const answers = await request.json();
	try {
		const result = await getGoogleFormService().submitForm(formId!, answers);
		return json(result, { status: result.ok ? 200 : 502 });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'unknown error';
		return json({ ok: false, status: 0, error: message }, { status: 500 });
	}
};
