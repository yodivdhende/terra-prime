import { eventRepo, isLarpEvent } from '$lib/db/event.repo';
import { ensureSpreadsheetForEvent } from '$lib/server/event-sheet.service';
import { BadRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), ['admin']);
		return json(await eventRepo.getAll());
	});
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const body = await request.json();
		const event = {
			...body,
			start: body.start ? new Date(body.start) : null,
			end: body.end ? new Date(body.end) : null,
		}
		if (isLarpEvent(event) == false) throw new BadRequest();
		const insertId = await eventRepo.save(event);
		if (insertId != null && event.formId && !event.sheetId) {
			try {
				const sheetId = await ensureSpreadsheetForEvent({ ...event, id: insertId });
				await eventRepo.setSheetId(insertId, sheetId);
			} catch (err) {
				console.error('[event-sheet] failed to create spreadsheet on create', { eventId: insertId, err });
			}
		}
		return new Response();
	});
};


