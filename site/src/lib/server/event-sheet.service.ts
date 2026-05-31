import type { LarpEvent } from '$lib/db/event.repo';
import { getGoogleFormService, type GoogleForm } from '$lib/services/google-form-service';
import { getGoogleSheetService } from '$lib/services/google-sheet-service';

export const EVENT_RESPONSES_FOLDER_ID = '1fxhnT9gEr6CWyfBgGQ1ZWYoGkpLH4c-J';

export type FormQuestion = { questionId: string; title: string };

export function questionsInOrder(form: GoogleForm): FormQuestion[] {
	return (form.items ?? []).flatMap((item): FormQuestion[] => {
		if (item.questionItem?.question?.questionId) {
			return [{ questionId: item.questionItem.question.questionId, title: item.title ?? '' }];
		}
		if (item.questionGroupItem?.questions) {
			return item.questionGroupItem.questions
				.filter(q => !!q.questionId)
				.map(q => ({
					questionId: q.questionId!,
					title: q.rowQuestion?.title ?? item.title ?? '',
				}));
		}
		return [];
	});
}

export function buildHeaders(form: GoogleForm): string[] {
	return ['Timestamp', 'User ID', 'Name', 'Email', ...questionsInOrder(form).map(q => q.title)];
}

export async function ensureSpreadsheetForEvent(event: LarpEvent): Promise<string> {
	if (!event.formId) throw new Error('event has no formId');
	const form = await getGoogleFormService().getForm(event.formId);
	const headers = buildHeaders(form);
	return getGoogleSheetService().createResponseSpreadsheet(
		`${event.name} — Registrations`,
		EVENT_RESPONSES_FOLDER_ID,
		headers,
	);
}
