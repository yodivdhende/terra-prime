import { emailTemplateRepo, extractDocId } from '$lib/db/email_template.repo';
import { getGoogleDriveService } from '$lib/services/google-drive-service';
import { getGoogleGmailService } from '$lib/services/google-gmail-service';
import { RequestError } from '$lib/types/errors';

const SUBJECTS: Record<string, string> = {
	verify_email: 'Verify your Terra Prime email'
};

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export async function sendTemplated({
	to,
	templateKey,
	link
}: {
	to: string;
	templateKey: string;
	link?: string;
}): Promise<void> {
	const subject = SUBJECTS[templateKey];
	if (subject == null) throw new RequestError(400, `unknown email templateKey: ${templateKey}`);

	const template = await emailTemplateRepo.getByKey(templateKey);
	if (template == null) throw new RequestError(500, `no Email_Templates row for key: ${templateKey}`);

	const docId = extractDocId(template.docUrl);
	if (docId == null)
		throw new RequestError(500, `could not extract Doc id from URL: ${template.docUrl}`);

	let html = await getGoogleDriveService().getDocumentHtml(docId);
	if (link != null) html = html.replaceAll('[[LINK]]', escapeHtml(link));

	await getGoogleGmailService().sendMail({ to, subject, html });
}
