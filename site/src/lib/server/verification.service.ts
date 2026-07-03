import { emailVerificationRepo } from '$lib/db/email_verification.repo';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { sendTemplated } from './email.service';

export async function sendVerificationEmail(userId: number, email: string): Promise<void> {
	const token = await emailVerificationRepo.createToken(userId);
	const link = `${PUBLIC_BASE_URL}/verify-email?token=${encodeURIComponent(token)}`;
	await sendTemplated({ to: email, templateKey: 'verify_email', link });
}

export async function confirmToken(token: string): Promise<number> {
	return emailVerificationRepo.consumeToken(token);
}
