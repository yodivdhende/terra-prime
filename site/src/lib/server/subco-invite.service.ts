import { PUBLIC_BASE_URL } from '$env/static/public';
import { subcoInviteRepo } from '$lib/db/subco_invite.repo';
import { sendTemplated } from './email.service';

export async function sendSubcoInvite({
	subcoId,
	email
}: {
	subcoId: number;
	email: string;
}): Promise<void> {
	const token = await subcoInviteRepo.createToken({ subcoId, email });
	const link = `${PUBLIC_BASE_URL}/codex?invite=${encodeURIComponent(token)}`;
	try {
		await sendTemplated({ to: email, templateKey: 'subco_invite', link });
	} catch (err) {
		await subcoInviteRepo.setStatus({ token, status: 'error' });
		throw err;
	}
}

/**
 * Resend an invite by token: extends its expiry, resets status to 'invited',
 * and re-sends the invite email. Sets Status = 'error' if sending fails.
 */
export async function resendSubcoInvite({ token }: { token: string }): Promise<void> {
	const row = await subcoInviteRepo.getByToken({ token });
	await subcoInviteRepo.extendAndReset({ token });
	const link = `${PUBLIC_BASE_URL}/codex?invite=${encodeURIComponent(token)}`;
	try {
		await sendTemplated({ to: row.email, templateKey: 'subco_invite', link });
	} catch (err) {
		await subcoInviteRepo.setStatus({ token, status: 'error' });
		throw err;
	}
}
