import { eventRepo } from '$lib/db/event.repo';
import { userRepo } from '$lib/db/user.repo';
import { isNumberOrError } from '$lib/request.utils';
import {
	EVENT_RESPONSES_FOLDER_ID,
	buildHeaders,
	questionsInOrder,
} from '$lib/server/event-sheet.service';
import { getGoogleFormService, type AnswerMap } from '$lib/services/google-form-service';
import { getGoogleSheetService } from '$lib/services/google-sheet-service';
import { NotFoundRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

function formatAnswer(value: string | string[] | undefined | null): string {
	if (value == null) return '';
	if (Array.isArray(value)) return value.join(', ');
	return value;
}

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	return handleRequest(async () => {
		const { userId } = await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
		const eventId = isNumberOrError(params.eventId);
		const event = await eventRepo.getWithId(eventId);
		if (!event || !event.formId) throw new NotFoundRequest();

		const [user, form, answers] = await Promise.all([
			userRepo.getById({ id: userId }),
			getGoogleFormService().getForm(event.formId),
			request.json() as Promise<AnswerMap>,
		]);

		const headers = buildHeaders(form);
		const sheets = getGoogleSheetService();

		let sheetId = event.sheetId;
		if (!sheetId) {
			sheetId = await sheets.createResponseSpreadsheet(
				`${event.name} — Registrations`,
				EVENT_RESPONSES_FOLDER_ID,
				headers,
			);
			await eventRepo.setSheetId(eventId, sheetId);
		}

		const row = [
			new Date().toISOString(),
			String(userId),
			user.name,
			user.email,
			...questionsInOrder(form).map(q => formatAnswer(answers?.[q.questionId])),
		];

		await sheets.appendResponseRow(sheetId, headers, row);
		return json({ ok: true, status: 200 });
	});
};
