/**
 * Maps a character's Software & Hacking experience onto a sequence length.
 *
 * A skilled hacker gets a short sequence to repeat; an untrained one gets a
 * long one. Bands are inclusive of their lower bound, so a character sitting
 * exactly on a boundary lands in the easier band.
 *
 * Ported from `minigames/simon-says/simon/difficulty.py` — keep the two in sync
 * if the bands ever change.
 */

/** (minimum experience, sequence length), highest threshold first. */
export const SEQUENCE_BANDS: readonly (readonly [number, number])[] = [
	[100, 2],
	[80, 3],
	[60, 4],
	[40, 5],
	[20, 6],
	[0, 7]
];

/** Length used when experience somehow falls below every band. */
export const HARDEST_LENGTH = SEQUENCE_BANDS[SEQUENCE_BANDS.length - 1][1];

export function sequenceLengthFor(experience: number): number {
	for (const [minimum, length] of SEQUENCE_BANDS) {
		if (experience >= minimum) return length;
	}
	return HARDEST_LENGTH;
}

/** Terminal HUD string, e.g. `HACKING 040 // 5 SIGNALEN`. */
export function bandLabel(experience: number): string {
	const xp = String(Math.max(0, Math.trunc(experience))).padStart(3, '0');
	return `HACKING ${xp} // ${sequenceLengthFor(experience)} SIGNALEN`;
}
