import { PUBLIC_BASE_URL } from '$env/static/public';
import { characterRepo } from '$lib/db/character.repo';
import { subcoRepo } from '$lib/db/subco.repo';
import { subcoInviteRepo } from '$lib/db/subco_invite.repo';
import { userRepo } from '$lib/db/user.repo';
import { sendTemplated } from './email.service';

/**
 * Add every character owned by `userId` to the subco. Goes through
 * `subcoRepo.save`, so the single-company rule is enforced (a mismatching
 * character makes the whole join fail).
 */
export async function joinSubcoForUser(subcoId: number, userId: number): Promise<void> {
	const subco = await subcoRepo.getWithId(subcoId);
	if (subco == null) return;
	const characters = await characterRepo.getByOwner(userId);
	const newMembers = characters
		.map((character) => character.id)
		.filter((id) => subco.members.includes(id) === false);
	if (newMembers.length === 0) return;
	await subcoRepo.save({ ...subco, members: [...subco.members, ...newMembers] });
}

/**
 * Invite a player to a subco by email (free-text). If the email is already
 * registered, add their character(s) directly and notify them; otherwise store
 * an invite token and email a register-to-join link.
 */
export async function sendSubcoInvite({
	subcoId,
	email
}: {
	subcoId: number;
	email: string;
}): Promise<void> {
	// `getByEmail` throws when the user is absent (mirror the forgot-password flow).
	let userId: number | null = null;
	try {
		userId = (await userRepo.getByEmail({ email })).id;
	} catch {
		userId = null;
	}

	if (userId != null) {
		await joinSubcoForUser(subcoId, userId);
		// Best-effort notification — never fail the invite because the mail bounced.
		try {
			await sendTemplated({
				to: email,
				templateKey: 'subco_invite',
				link: `${PUBLIC_BASE_URL}/codex`
			});
		} catch (err) {
			console.error('[subco-invite] failed to notify existing user:', err);
		}
		return;
	}

	const token = await subcoInviteRepo.createToken({ subcoId, email });
	const link = `${PUBLIC_BASE_URL}/codex?invite=${encodeURIComponent(token)}`;
	await sendTemplated({ to: email, templateKey: 'subco_invite', link });
}
