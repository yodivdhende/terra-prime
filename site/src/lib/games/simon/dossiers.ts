/**
 * Static content of the Vostok-9 archive the Simon win screen unlocks.
 *
 * The two readable dossiers are transcribed from the organizers' Google Docs
 * (`Medisch_Dossier_Anatoli_Lebedev` / `Medisch_Dossier_Katerina_Lebedeva`) and
 * reshaped into terminal lines. Hardcoded on purpose: a Drive-backed version would
 * also surface these docs in the codex desktop and its Drive search.
 */

export type DossierLine = {
	label?: string;
	text: string;
	/** Rendered as a `>>` line in accent glow — the AVIX and plant-vision beats. */
	highlight?: boolean;
};

export type AvixPoint = {
	/** `dd.mm` within Nov–Dec 1966. */
	date: string;
	value: number;
	note?: string;
};

export type DossierLogEntry = {
	stamp: string;
	vitals: string;
	initials: string;
	observation: string;
	action: string;
	highlight?: boolean;
};

export type Dossier = {
	fields: [string, string][];
	avix: {
		value: number;
		category: string;
		series: AvixPoint[];
		/** Set when the series stops because the subject was lost (Anatoli's drift). */
		lost?: { date: string; label: string };
		lines: DossierLine[];
	};
	sections: { title: string; lines: DossierLine[] }[];
	log: DossierLogEntry[];
	assessment: DossierLine[];
};

/** A plain service note; `code` is rendered as big dial digits. */
export type Memo = {
	header: string[];
	lines: DossierLine[];
	code: string;
	footer: string[];
};

/** Combination of the physical number lock in the room. Change here if the lock is reset. */
export const LOCK_COMBINATION = '4719';

export const LOCK_MEMO: Memo = {
	header: [
		'VOSTOK-9 · DIENST BEVEILIGING',
		'Dienstnota nr. B-66/41 — Wijziging combinatie',
		'Verspreiding: uitsluitend personeel niveau −3'
	],
	lines: [
		{ label: 'Betreft', text: 'Archiefkist medische dienst, niveau −3, gang C.' },
		{
			label: 'Reden',
			text: 'Na het incident van 20.11 is de vorige combinatie als gecompromitteerd beschouwd. Het slot werd opnieuw ingesteld.'
		},
		{
			label: 'Nieuwe combinatie',
			text: 'zie hieronder. Niet noteren, niet doorgeven.',
			highlight: true
		}
	],
	code: LOCK_COMBINATION,
	footer: ['Deze nota na lezing vernietigen.', 'Kpt. V. Ivanov, hoofd beveiliging niveau −3']
};

export const DOSSIER_HEADER = [
	'STRIKT GEHEIM  /  СОВЕРШЕННО СЕКРЕТНО',
	'VOSTOK-9 · MEDISCHE DIENST & KLINISCH ARCHIEF',
	'Afdeling Proefpersonendossiers & Opnames — Register nr. 9/K',
	'Project "Tsjornoje Zerkalo"'
];

export const DOSSIER_SIGNATURE = [
	'Handtekening behandelend arts:',
	'Dr. Irina S. Sokolova, geneesheer-officier',
	'Medische Dienst Vostok-9, Ministerie van Defensie van de USSR',
	'Medeondertekend — Hoofd Onderzoek: Dr. A. Volorin'
];

/** Shared y-scale for both graphs so the siblings compare directly. */
export const AVIX_SCALE_MAX = 70;
export const AVIX_NORMAL = 0.3;

const INTEL_NOTE: DossierLine = {
	label: 'Nota inlichtingendienst',
	text: 'De term "AVIX" is afkomstig uit buitgemaakte buitenlandse stukken, bezorgd door onze agenten. De bloedwaarde wordt bepaald met het Volorin-reagens. Een normale mens scoort onder 0,3. Alles daarboven is uitzonderlijk en van belang voor het project.'
};

const FAMILY_HISTORY_MOTHER =
	'Moeder (Maria Lebedeva, geb. Orlova) verdween in het bos bij Povenets, najaar 1949; door de dorpssovjet overleden verklaard.';

export const ANATOLI: Dossier = {
	fields: [
		['Dossiernr.', 'V9-66-017'],
		['Datum opname', '03.11.1966'],
		['Naam proefpersoon', 'Anatoli Petrovitsj Lebedev'],
		['Leeftijd / geslacht', '23 jaar / man'],
		['Burgerlijke staat', 'Ongehuwd (zus: proefpersoon V9-66-018)'],
		['Beroep', 'Visser / bootsman, Onegameer'],
		['Cel', 'Celblok B, cel 4 (observatievleugel)'],
		['Behandelend arts', 'Dr. I. Sokolova'],
		['Herkomst', 'Povenets, Karelische ASSR'],
		['Werving', '"Vrijwillig" (districtscomité)'],
		['AVIX-klasse', 'Categorie A — hoog'],
		['Projectstatus', 'VERDWENEN (drift, exp. 112)']
	],
	avix: {
		value: 41.8,
		category: 'A — HOOG',
		series: [
			{ date: '03.11', value: 41.8, note: 'opname' },
			{ date: '11.11', value: 42.1 },
			{ date: '20.11', value: 44.6, note: 'controle voor drift' }
		],
		lost: { date: '20.11', label: 'SIGNAAL VERBROKEN 11:43' },
		lines: [
			{
				text: 'AVIX POSITIEF. Waarde 41,8 AVIX-eenheden/ml (normaal: onder 0,3).',
				highlight: true
			},
			{
				text: 'Serum vertoont onder UV-lamp een zwakke, aanhoudende gloed. De meting werd driemaal gecontroleerd.'
			},
			{
				text: '20.11.66: AVIX 44,6 — de hoogste waarde in celblok B tot dan toe. Sindsdien geen metingen meer mogelijk.',
				highlight: true
			},
			INTEL_NOTE
		]
	},
	sections: [],
	log: [
		{
			stamp: '03.11.66 09:00',
			vitals: 'P 64 / T 36,4°',
			initials: 'I.S.',
			observation: 'Basisonderzoek voltooid. AVIX 41,8. Proefpersoon werkt mee, slaapt slecht.',
			action:
				'Volledige bloedafname (60 ml). 24 uur onder observatie. Kalmeermiddel achterwege gelaten om de metingen zuiver te houden.',
			highlight: true
		},
		{
			stamp: '11.11.66 14:00',
			vitals: 'P 66 / T 36,5°',
			initials: 'I.S.',
			observation:
				'AVIX stabiel op 42,1. Voorwerpen worden opgemerkt "voor ze binnengebracht worden". Benoemt driemaal op vijf de inhoud van een verzegelde doos.',
			action: 'Herhaling van de proeven onder toezicht van Dr. Volorin. Dagelijks wegen en meten.',
			highlight: true
		},
		{
			stamp: '20.11.66 06:30',
			vitals: 'P 72 / T 36,8°',
			initials: 'A.V.',
			observation:
				'Controle voor de drift. Verklaart "niet bang" te zijn: "de spiegel kent mij al". AVIX 44,6.',
			action:
				'Goedgekeurd voor experiment 112 (niveau −3). Markeerkraag aangebracht. Verpleegster en bewaker trekken zich terug.',
			highlight: true
		},
		{
			stamp: '20.11.66 11:42',
			vitals: '— / —',
			initials: 'A.V.',
			observation: 'Proefpersoon betreedt de spiegel om 11:42.',
			action: 'Signaal van de markeerkraag ontvangen tot 11:43.'
		},
		{
			stamp: '20.11.66 11:43',
			vitals: '— / —',
			initials: 'A.V.',
			observation: 'Signaal verbroken. Geen beeld, geen geluid, geen respons op de intercom.',
			action: 'Diensthebbende officier krijgt bevel de kamer niet te betreden.'
		},
		{
			stamp: '21.11 – 05.12.66',
			vitals: '— / —',
			initials: 'I.S.',
			observation:
				'Dagelijkse pogingen tot contact: radio, kabel, een gemerkt voorwerp door de spiegel gestuurd. Niets keert terug.',
			action:
				'Zoekpatrouilles in het omliggende bos: negatief. Wachters gewaarschuwd, doen alsof er niets aan de hand is.'
		},
		{
			stamp: '06.12.66 08:00',
			vitals: '— / —',
			initials: 'A.V.',
			observation: 'Proefpersoon nog steeds niet teruggekeerd, niet bereikbaar.',
			action: 'Status gewijzigd naar VERDWENEN (drift). Dossier blijft open.'
		}
	],
	assessment: [
		{
			label: 'Beoordeling',
			text: 'AVIX-positieve proefpersoon, categorie A. Betrad de spiegel zonder aarzeling en zonder zichtbare lichamelijke reactie. Verdere gegevens ontbreken.'
		},
		{
			label: 'Toestand',
			text: 'Onbekend. Er is geen communicatie meer mogelijk. Het is niet vastgesteld of hij nog leeft.'
		},
		{
			label: 'Bestemming',
			text: 'Dossier open houden. Niet als overleden inschrijven. Elke aanwijzing over zijn lot onmiddellijk aan Dr. Volorin melden.'
		},
		{
			label: 'Beperkingen',
			text: 'Contact met proefpersoon V9-66-018 enkel op beslissing van Dr. Volorin. Familie in Povenets krijgt geen mededeling.'
		}
	]
};

export const KATERINA: Dossier = {
	fields: [
		['Dossiernr.', 'V9-66-018'],
		['Datum opname', '03.11.1966'],
		['Naam proefpersoon', 'Katerina Petrovna Lebedeva'],
		['Leeftijd / geslacht', '19 jaar / vrouw'],
		['Burgerlijke staat', 'Ongehuwd (broer: proefpersoon V9-66-017)'],
		['Beroep', 'Netten- en kledingnaaister, coöperatie Povenets'],
		['Cel', 'Celblok B, cel 7 (observatievleugel)'],
		['Behandelend arts', 'Dr. I. Sokolova'],
		['Herkomst', 'Povenets, Karelische ASSR'],
		['Werving', '"Vrijwillig" (districtscomité)'],
		['AVIX-klasse', 'Categorie A+ — zeer hoog'],
		['Projectstatus', 'Onder observatie (visioenen)']
	],
	avix: {
		value: 58.3,
		category: 'A+ — ZEER HOOG',
		series: [
			{ date: '03.11', value: 58.3, note: 'opname' },
			{ date: '10.11', value: 59.0 },
			{ date: '20.11', value: 60.8, note: 'instorting, exp. 112' },
			{ date: '28.11', value: 61.7 },
			{ date: '05.12', value: 62.9, note: 'berk-proef' },
			{ date: '12.12', value: 64.4 }
		],
		lines: [
			{
				text: 'AVIX POSITIEF. Waarde 58,3 AVIX-eenheden/ml, de hoogste die de dienst ooit noteerde (normaal: onder 0,3).',
				highlight: true
			},
			{
				text: 'Het staal blijft na afname uren gloeien. De waarde overtreft die van haar broer met een derde.'
			},
			{
				text: 'Wekelijkse afnames tonen een gestage stijging, telkens het sterkst na een visioen. 12.12.66: 64,4.',
				highlight: true
			},
			INTEL_NOTE
		]
	},
	sections: [],
	log: [
		{
			stamp: '03.11.66 10:00',
			vitals: 'P 76 / T 36,2°',
			initials: 'I.S.',
			observation:
				'Basisonderzoek voltooid. AVIX 58,3. Neusbloeding tijdens de bloedafname. Vraagt of haar broer "nog aan deze kant" is.',
			action: 'Volledige bloedafname (60 ml). Cel 7. Watten, koud kompres.'
		},
		{
			stamp: '07.11.66 14:30',
			vitals: 'P 82 / T 36,4°',
			initials: 'N.K.',
			observation:
				'Eerste wandeling op de binnenplaats. Legt haar hand tegen een den aan de omheining en stort in elkaar met een neusbloeding. Fluistert dat "het bos boos is". Terug in de cel: geen verdere symptomen.',
			action:
				'Kalmeermiddel (chloorpromazine 25 mg). Incident gemeld aan Dr. Volorin. Wandeling afgebroken.',
			highlight: true
		},
		{
			stamp: '20.11.66 11:42',
			vitals: 'P 96 / T 36,7°',
			initials: 'I.S.',
			observation:
				'Hand op de stam van de den. Stort in elkaar om 11:42, op het moment dat experiment 112 begint. Zware neusbloeding, spierstijfheid gedurende 40 seconden. Fluistert: "Hij is weg. Hij is door de zwarte deur."',
			action: 'Koud kompres, zuurstof. Uitspraak aan Dr. Volorin doorgegeven. Rust in cel 7.',
			highlight: true
		},
		{
			stamp: '21.11 – 28.11.66',
			vitals: 'P 78 / T 36,4°',
			initials: 'I.S.',
			observation:
				'Elke aanraking van de den of van de potplanten in de gang (varen, geranium) brengt een visioen van haar broer: hij staat op een plek "waar de lucht de verkeerde kleur heeft", grijsbruin en zwaar van rook. Een eindeloze fabrieksstad zonder horizon: schoorstenen, staal en pijpen tot aan de einder, en een ritmisch gebonk "als een hart dat nooit stopt". Tekent het landschap.',
			action:
				'Tekening bewaard in dossier. Dr. Volorin wil de visioenen laten optekenen onder toezicht.',
			highlight: true
		},
		{
			stamp: '05.12.66 14:00',
			vitals: 'P 84 / T 36,6°',
			initials: 'I.S.',
			observation:
				'Gecontroleerde proef. Levende, in de grond wortelende planten (varen, geranium, een jonge berk in een kuip) leiden telkens tot een visioen. Afgesneden tak, houten meubilair, bloemen in een vaas: geen effect. Bij de berk het sterkst: broer is levend, bang, "maar niet alleen". Een gigantische menigte die zich in dezelfde maat beweegt; velen met metalen ledematen, lenzen in plaats van ogen of kabels in de nek, "half mens, half machine". Niemand spreekt, allen kijken naar hem. AVIX 62,9 (stijgend).',
			action:
				'Verklaring opgetekend. Dr. Volorin vraagt: "Is hij nog in Povenets?" Antwoord: "Nee. Hij is ver weg."',
			highlight: true
		},
		{
			stamp: '12.12.66 10:15',
			vitals: 'P 70 / T 36,3°',
			initials: 'I.S.',
			observation:
				'Visioenen nemen toe in kracht, telkens na aanraking van de berk. Ziet haar broer tussen de machines, met een gloed in het bloed die de anderen aantrekt. Herhaalt: "Ze willen wat hij heeft. Hij roept mij, maar ik kan niet antwoorden."',
			action:
				'Sessies beperkt tot één per dag, onder toezicht. Permanente observatie. Berk bewaard voor verder onderzoek.',
			highlight: true
		}
	],
	assessment: [
		{
			label: 'Beoordeling',
			text: 'AVIX-positieve proefpersoon, categorie A+. De hoogste waarden van de dienst. Sinds het vertrek van haar broer visioenen van hem in een andere wereld, uitsluitend bij aanraking van levende bomen of planten die in de grond wortelen. Die wereld is sterk geïndustrialiseerd, overbevolkt en bewoond door mensen die deels of geheel met machines versmolten zijn. Officieel is er geen communicatie met de drift; deze visioenen zijn mogelijk de enige aanwijzing die wij hebben.',
			highlight: true
		},
		{
			label: 'Toestand',
			text: 'Lichamelijk zwak. Geestelijk kwetsbaar maar helder. Neusbloedingen en migraine nemen toe na elk visioen.'
		},
		{
			label: 'Bestemming',
			text: 'Blijft in Vostok-9. Niet gebruiken voor de spiegelpassage zonder uitdrukkelijke toestemming van Dr. Volorin. Visioenen enkel onder toezicht, met levende planten in de observatiekamer. Wekelijkse AVIX-afnames, alle uitspraken en tekeningen optekenen.'
		},
		{
			label: 'Beperkingen',
			text: 'Niet alleen laten op niveau −3. Geen contact met levende planten zonder toezicht. Personeel mag de spiegel niet bespreken in haar aanwezigheid.'
		}
	]
};

const NOISE_GLYPHS = '░▒▓█#@%&$*¤§ЖЩФЯЮЭЪЫБДГЛПЦЧШ0123456789/\\|<>{}';
const NOISE_FRAGMENTS = ['AV█X', 'ЗЕРК▒ЛО', 'V9-6░', 'спи█ал', 'Л▓БЕД', '1▒2', 'ДРЕЙ░', '▓▓▓'];

/** Deterministic garbage for a corrupt file, seeded by its id so it's stable across renders. */
export function corruptLines(id: string, count = 18, width = 56): string[] {
	let seed = 0;
	for (const char of id) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
	const random = () => {
		seed = (seed + 0x6d2b79f5) >>> 0;
		let t = seed;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};

	const lines: string[] = [];
	for (let row = 0; row < count; row++) {
		let line = '';
		while (line.length < width) {
			const roll = random();
			if (roll < 0.04) line += NOISE_FRAGMENTS[Math.floor(random() * NOISE_FRAGMENTS.length)];
			else if (roll < 0.18) line += ' ';
			else line += NOISE_GLYPHS[Math.floor(random() * NOISE_GLYPHS.length)];
		}
		lines.push(line.slice(0, width));
	}
	return lines;
}
