import { eventRepo, isLarpEvent, type LarpEvent } from '$lib/db/event.repo';
import { isNumberOrError } from '$lib/request.utils';
import { ensureSpreadsheetForEvent } from '$lib/server/event-sheet.service';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
	return handleRequest(async () => {
		await authGuardForUser(getSessionToken(cookies), ['admin', 'user']);
		const numberId = isNumberOrError(params.eventId);
		const event = await eventRepo.getWithId(numberId);
		if(event == null) throw new NotFoundRequest();
		return json(event);
	});
};

export const DELETE: RequestHandler = async ({ cookies, params}) => {
	return handleRequest(async () => {
		await authGuard(getSessionToken(cookies), ['admin']);
		const { eventId } = params;
		const numberId = isNumberOrError(eventId);
        await eventRepo.delete({id: numberId});
		return new Response();
	});
};

export const POST: RequestHandler = async ({cookies, params, request}) => {
	return handleRequest(async ()=> {
		await authGuard(getSessionToken(cookies), ['admin']);
		const {eventId} = params;
		const numberId = isNumberOrError(eventId);
		const body = await request.json();
		const existing = await eventRepo.getWithId(numberId);
		const event = {
			...body,
			id: numberId,
			start: body.start ? new Date(body.start) : null,
			end: body.end ? new Date(body.end) : null,
			sheetId: body.sheetId ?? existing?.sheetId ?? null,
		}
		if(isLarpEvent(event) === false) throw new BadRequest();
		await eventRepo.save(event);
		if (event.formId && !event.sheetId) {
			try {
				const sheetId = await ensureSpreadsheetForEvent(event);
				await eventRepo.setSheetId(numberId, sheetId);
			} catch (err) {
				console.error('[event-sheet] failed to create spreadsheet on save', { eventId: numberId, err });
			}
		}
		return new Response();
	})
}

