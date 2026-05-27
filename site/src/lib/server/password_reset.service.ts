import { passwordResetRepo } from '$lib/db/password_reset.repo';
import { authenticationRepo } from '$lib/db/authentication.repo';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { sendTemplated } from './email.service';

export async function sendPasswordResetEmail(userId: number, email: string): Promise<void> {
	const token = await passwordResetRepo.createToken(userId);
	const link = `${PUBLIC_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;
	await sendTemplated({ to: email, templateKey: 'password_reset', link });
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<number> {
	const userId = await passwordResetRepo.consumeToken(token);
	await authenticationRepo.updatePassword(userId, newPassword);
	return userId;
}
