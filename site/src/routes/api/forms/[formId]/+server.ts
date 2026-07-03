import { json, type RequestHandler } from '@sveltejs/kit';
import { getGoogleFormService } from '$lib/services/google-form-service';

export const GET: RequestHandler = async ({ params }) => {
  const { formId } = params;
  const form = await getGoogleFormService().getForm(formId);
  return json(form, {
    headers: { 'Cache-Control': 'no-store' },
  });
};
