/**
 * File tree of the Vostok-9 archive the Simon win screen unlocks. The readable
 * entries' content lives in `dossiers.ts`.
 */

import { ANATOLI, KATERINA, LOCK_MEMO, type Dossier, type Memo } from './dossiers';

export type ArchiveEntry =
	| { id: string; name: string; kind: 'folder'; children: ArchiveEntry[] }
	| { id: string; name: string; kind: 'dossier'; dossier: Dossier }
	| { id: string; name: string; kind: 'memo'; memo: Memo }
	| { id: string; name: string; kind: 'corrupt'; size: string };

export const ARCHIVE: ArchiveEntry[] = [
	{
		id: 'medisch',
		name: 'MEDISCHE_DIENST',
		kind: 'folder',
		children: [
			{ id: 'v9-66-017', name: 'V9-66-017_LEBEDEV_A.dos', kind: 'dossier', dossier: ANATOLI },
			{ id: 'v9-66-018', name: 'V9-66-018_LEBEDEVA_K.dos', kind: 'dossier', dossier: KATERINA },
			{ id: 'v9-66-019', name: 'V9-66-019_ORLOVA_M.dos', kind: 'corrupt', size: '12 KB' },
			{ id: 'v9-65-004', name: 'V9-65-004_KOEZNETSOVA_O.dos', kind: 'corrupt', size: '9 KB' },
			{ id: 'v9-66-021', name: 'V9-66-021_SMIRNOV_D.dos', kind: 'corrupt', size: '14 KB' },
			{ id: 'v9-65-011', name: 'V9-65-011_POPOVA_J.dos', kind: 'corrupt', size: '7 KB' }
		]
	},
	{
		id: 'zerkalo',
		name: 'PROJECT_TSJORNOJE_ZERKALO',
		kind: 'folder',
		children: [
			{ id: 'exp-112', name: 'EXP_112_VERSLAG.log', kind: 'corrupt', size: '31 KB' },
			{ id: 'volorin', name: 'VOLORIN_A_NOTITIES.txt', kind: 'corrupt', size: '48 KB' },
			{ id: 'bereza', name: 'BEREZA_OBSERVATIE.dat', kind: 'corrupt', size: '22 KB' },
			{ id: 'personeel', name: 'PERSONEEL_NIVEAU-3_IVANOV.lst', kind: 'corrupt', size: '5 KB' }
		]
	},
	{
		id: 'beveiliging',
		name: 'DIENST_BEVEILIGING',
		kind: 'folder',
		children: [
			{ id: 'b-66-41', name: 'B-66-41_COMBINATIE_NIV-3.txt', kind: 'memo', memo: LOCK_MEMO }
		]
	}
];
