/** Shared between the client game manager and the server lookup endpoint. */

export const PAD_IDS = ['UP', 'DOWN', 'LEFT', 'RIGHT'] as const;
export type PadId = (typeof PAD_IDS)[number];

export type ActiveCharacterInfo = {
	id: number;
	name: string;
	ownerName: string;
	versionId: number;
	versionName: string;
	eventId: number;
	eventName: string;
	hackingXp: number;
};

export type AmbiguousCandidate = {
	id: number;
	name: string;
	ownerName: string;
};

export type LookupSuccess = {
	character: ActiveCharacterInfo;
	sequenceLength: number;
};

export type LookupErrorCode =
	| 'name-required'
	| 'no-live-event'
	| 'not-found'
	| 'ambiguous'
	| 'not-in-live-event'
	| 'internal';

export type LookupError = {
	error: LookupErrorCode;
	message: string;
	candidates?: AmbiguousCandidate[];
};
