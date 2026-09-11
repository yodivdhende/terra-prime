import type { companies } from '../../src/lib/db/schema';

export const rows: (typeof companies.$inferInsert)[] = [
	{
		name: 'DE RIDDER HOLDINGS',
		description:
			'Bij De Ridder Holdings bouw je aan meer dan structuren \u2014 je bouwt aan de toekomst van Terra Prime zelf. Gedragen door vakbonden en generaties van ervaring, is er hier altijd plaats voor mensen die iets willen neerzetten dat blijft.',
		link: null
	},
	{
		name: 'BIOCORP',
		description:
			'BioCorp werkt aan wat ooit onmogelijk leek: een leven zonder grenzen. Als jij gelooft dat de mensheid meer kan zijn dan ze nu is, is hier de plek om dat waar te maken.',
		link: null
	},
	{
		name: 'LUMEN VEIL NETWORK',
		description:
			'Lumen Veil Network verspreidt wat mensen nodig hebben: richting, betekenis en waarheid. Word deel van een beweging die verder reikt dan nieuws of geloof \u2014 en ontdek hoe krachtig het juiste woord kan zijn.',
		link: null
	},
	{
		name: 'SYLVA CORE SYSTEMS',
		description:
			'Sylva Core Systems staat aan de frontier van wat kennis kan zijn. Hier werk je samen met de scherpste geesten aan vragen die het multiversum zelf stelt \u2014 voor wie nieuwsgierigheid geen grens kent.',
		link: null
	},
	{
		name: 'BLACKWATER DIRECTIVE',
		description:
			'Blackwater Directive zoekt mensen die niet aarzelen wanneer het erop aankomt. Als jij gedijt onder druk en wil bijdragen aan echte orde op Terra Prime, dan is er hier een plek voor jou.',
		link: null
	}
];
