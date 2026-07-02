export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ApiEndpoint = {
	method: ApiMethod;
	path: string;
	auth: string;
	returns: string;
	description: string;
};

export type ApiDocSection = {
	title: string;
	note?: string;
	endpoints: ApiEndpoint[];
};

export const apiDocSections: ApiDocSection[] = [
	{
		title: 'Authentication',
		endpoints: [
			{
				method: 'POST',
				path: '/api/authentication/register',
				auth: 'Public',
				returns: '`{ userId: number, roles: string[] }` (JSON)',
				description: 'Register new user; sets session cookie'
			},
			{
				method: 'POST',
				path: '/api/authentication/login',
				auth: 'Public',
				returns: '`{ token: string, roles: string[], name: string }` (JSON)',
				description: 'Login with `{ email, password }`; sets session cookie'
			},
			{
				method: 'POST',
				path: '/api/authentication/login/token',
				auth: 'Public',
				returns: '`{ token: string }` (JSON)',
				description: 'Set session cookie from existing token `{ token }`'
			},
			{
				method: 'POST',
				path: '/api/authentication/verify-email',
				auth: 'Public',
				returns: '`{ ok: true, userId: number }` (JSON)',
				description:
					'Consume a verification token; body: `{ token: string }`. Returns 400 if invalid/expired'
			},
			{
				method: 'POST',
				path: '/api/authentication/verify-email/resend',
				auth: 'user/admin',
				returns: '`{ ok: true }` (JSON)',
				description:
					'Resend verification email to the current session user. Returns 400 if already verified'
			},
			{
				method: 'POST',
				path: '/api/authentication/forgot-password',
				auth: 'Public',
				returns: '`{ ok: true }` (JSON)',
				description:
					'Request a password reset email; body: `{ email: string }`. Always returns 200 even when the email is unknown (no enumeration)'
			},
			{
				method: 'POST',
				path: '/api/authentication/reset-password',
				auth: 'Public',
				returns: '`{ ok: true, userId: number }` (JSON)',
				description:
					"Consume a password reset token and update the user's password; body: `{ token: string, password: string }`. Returns 400 for invalid/expired token or password shorter than 8 characters"
			}
		]
	},
	{
		title: 'Email & Admin',
		endpoints: [
			{
				method: 'POST',
				path: '/api/admin/emails/send',
				auth: 'admin',
				returns: '`{ ok: true }` (JSON)',
				description:
					'Send any template to any recipient; body: `{ to: string, templateKey: string, link?: string }`. Throws 400 for unknown template keys'
			},
			{
				method: 'POST',
				path: '/api/admin/users/[id]/resend-verification',
				auth: 'admin',
				returns: '`{ ok: true }` (JSON)',
				description: 'Resend verification email to a specific user. Returns 400 if already verified'
			},
			{
				method: 'POST',
				path: '/api/admin/users/[id]/send-password-reset',
				auth: 'admin',
				returns: '`{ ok: true }` (JSON)',
				description: 'Send a password reset email to a specific user'
			}
		]
	},
	{
		title: 'Email Templates',
		note: 'Templates are `{ id, key, docUrl }` rows. `docUrl` is a Google Doc URL whose HTML is fetched via the Drive service at send-time. Subjects are hardcoded per `key` in `src/lib/server/email.service.ts`. Templates support a literal `[[LINK]]` marker that is replaced (HTML-escaped) when a `link` is provided to the sender.',
		endpoints: [
			{
				method: 'GET',
				path: '/api/email-templates',
				auth: 'admin',
				returns:
					'`EmailTemplate[]` (JSON) — `EmailTemplate = { id: number | null, key: string, docUrl: string }`',
				description: 'List all templates'
			},
			{
				method: 'PUT',
				path: '/api/email-templates',
				auth: 'admin',
				returns: '`{ id: number }` (JSON)',
				description: 'Upsert template; body: `EmailTemplate`. Insert when `id` is null, update otherwise'
			},
			{
				method: 'GET',
				path: '/api/email-templates/[id]',
				auth: 'admin',
				returns: '`EmailTemplate` (JSON; 404 if not found)',
				description: 'Get template by ID'
			},
			{
				method: 'POST',
				path: '/api/email-templates/[id]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Update template; body: `EmailTemplate`'
			},
			{
				method: 'DELETE',
				path: '/api/email-templates/[id]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Delete template'
			}
		]
	},
	{
		title: 'Sessions',
		endpoints: [
			{
				method: 'GET',
				path: '/api/sessions',
				auth: 'admin',
				returns: '`Session[]` (JSON)',
				description: 'List all sessions'
			},
			{
				method: 'POST',
				path: '/api/sessions',
				auth: 'admin',
				returns: '`string` (JSON-encoded token)',
				description: 'Create session; body: `NewSession`'
			},
			{
				method: 'DELETE',
				path: '/api/sessions/[token]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Delete session by token'
			}
		]
	},
	{
		title: 'Users',
		endpoints: [
			{
				method: 'GET',
				path: '/api/users',
				auth: 'admin',
				returns: '`User[]` (JSON)',
				description: 'List all users'
			},
			{
				method: 'GET',
				path: '/api/users/[id]',
				auth: 'admin',
				returns: '`User` (JSON)',
				description: 'Get user by ID'
			},
			{
				method: 'POST',
				path: '/api/users/[id]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Update user; body: `User` (raw, no wrapper)'
			}
		]
	},
	{
		title: 'Skills',
		endpoints: [
			{
				method: 'GET',
				path: '/api/skills',
				auth: 'admin/user',
				returns:
					'`Skill[]` (JSON) — `Skill = { id: number | null, name: string, description: string, groupId: number, groupName: string, cost?: number }`',
				description: 'List all skills'
			},
			{
				method: 'PUT',
				path: '/api/skills',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Create/update skill; body: `Skill`'
			},
			{
				method: 'GET',
				path: '/api/skills/[id]',
				auth: 'admin',
				returns: '`Skill` (JSON)',
				description: 'Get skill by ID'
			},
			{
				method: 'POST',
				path: '/api/skills/[id]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Update skill; body: `Skill`'
			},
			{
				method: 'DELETE',
				path: '/api/skills/[id]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Delete skill'
			},
			{
				method: 'GET',
				path: '/api/skills/groups',
				auth: 'admin/user',
				returns: '`SkillGroup[]` (JSON) — `SkillGroup = { id: number | null, name: string, description: string }`',
				description: 'List all skill groups'
			},
			{
				method: 'PUT',
				path: '/api/skills/groups',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Create/update skill group; body: `SkillGroup`'
			},
			{
				method: 'GET',
				path: '/api/skills/groups/[id]',
				auth: 'admin',
				returns: '`SkillGroup` (JSON)',
				description: 'Get skill group by ID'
			},
			{
				method: 'POST',
				path: '/api/skills/groups/[id]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Update skill group; body: `SkillGroup`'
			},
			{
				method: 'DELETE',
				path: '/api/skills/groups/[id]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Delete skill group'
			}
		]
	},
	{
		title: 'Items',
		endpoints: [
			{
				method: 'GET',
				path: '/api/items',
				auth: 'admin/user',
				returns:
					'`Item[]` (JSON) — `Item = { id: number | null, name: string, description: string, cost?: number }`',
				description: 'List all items'
			},
			{
				method: 'PUT',
				path: '/api/items',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Create/update item; body: `Item`'
			},
			{
				method: 'GET',
				path: '/api/items/[id]',
				auth: 'admin',
				returns: '`Item` (JSON)',
				description: 'Get item by ID'
			},
			{
				method: 'POST',
				path: '/api/items/[id]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Update item; body: `Item`'
			},
			{
				method: 'DELETE',
				path: '/api/items/[id]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Delete item'
			}
		]
	},
	{
		title: 'Implants',
		endpoints: [
			{
				method: 'GET',
				path: '/api/implants',
				auth: 'admin/user',
				returns:
					'`Implant[]` (JSON) — `Implant = { id: number | null, name: string, description: string, cost?: number }`',
				description: 'List all implants'
			},
			{
				method: 'PUT',
				path: '/api/implants',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Create/update implant; body: `Implant`'
			},
			{
				method: 'GET',
				path: '/api/implants/[id]',
				auth: 'admin',
				returns: '`Implant` (JSON)',
				description: 'Get implant by ID'
			},
			{
				method: 'POST',
				path: '/api/implants/[id]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Update implant; body: `Implant`'
			},
			{
				method: 'DELETE',
				path: '/api/implants/[id]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Delete implant'
			}
		]
	},
	{
		title: 'Companies',
		note: '`Company = { id: number | null, name: string, description: string, link: string | null }`.',
		endpoints: [
			{
				method: 'GET',
				path: '/api/companies',
				auth: 'admin/user',
				returns: '`Company[]` (JSON)',
				description: 'List all companies'
			},
			{
				method: 'PUT',
				path: '/api/companies',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Upsert company; body: `Company` (validated by `isCompany`)'
			},
			{
				method: 'GET',
				path: '/api/companies/[id]',
				auth: 'admin',
				returns: '`Company` (JSON; 404 if not found)',
				description: 'Get company by ID'
			},
			{
				method: 'POST',
				path: '/api/companies/[id]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Upsert company; body: `Company`'
			},
			{
				method: 'DELETE',
				path: '/api/companies/[id]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Delete company by ID'
			},
			{
				method: 'GET',
				path: '/api/companies/[id]/discounts',
				auth: 'admin/user',
				returns:
					'`CompanyDiscounts` (JSON) — `{ items: {itemId,discount}[], implants: {implantId,discount}[], skills: {skillId,discount}[] }`',
				description: "Get a company's discounts on items, implants and skills"
			},
			{
				method: 'POST',
				path: '/api/companies/[id]/discounts',
				auth: 'admin',
				returns: 'empty body (200)',
				description:
					'Replace a company\'s discounts; body: `CompanyDiscounts` (validated by `isCompanyDiscounts`)'
			}
		]
	},
	{
		title: 'Characters',
		endpoints: [
			{
				method: 'GET',
				path: '/api/characters',
				auth: 'admin',
				returns: '`Character[]` (JSON)',
				description: 'List all characters'
			},
			{
				method: 'PUT',
				path: '/api/characters',
				auth: 'admin/user',
				returns: '`{ id: number | undefined }` (JSON)',
				description: 'Create character; body: `NewCharacter`'
			},
			{
				method: 'GET',
				path: '/api/characters/[characterId]',
				auth: 'admin/user',
				returns: '`Character` (JSON)',
				description: 'Get character by ID'
			},
			{
				method: 'POST',
				path: '/api/characters/[characterId]',
				auth: 'admin/user',
				returns: 'empty body (200)',
				description: 'Update character; body: `Character | NewCharacter`'
			},
			{
				method: 'GET',
				path: '/api/characters/[characterId]/events/[eventId]',
				auth: 'user',
				returns: '`{ characterVersion: CharacterVersionBare | undefined }` (JSON)',
				description: 'Get the character version used for a specific event'
			},
			{
				method: 'POST',
				path: '/api/characters/[characterId]/backstory',
				auth: 'user',
				returns: '`{ id: string }` (JSON — Google Doc ID)',
				description:
					"Create a Google Doc backstory for the character and save its ID on the character record. Returns 409 if a backstory doc already exists"
			},
			{
				method: 'GET',
				path: '/api/characters/[characterId]/versions',
				auth: 'admin',
				returns: '`{ id: number, name: string, characterId: number }[]` (JSON)',
				description: "List all versions of a character"
			},
			{
				method: 'PUT',
				path: '/api/characters/[characterId]/versions',
				auth: 'admin',
				returns: '`{ id: number }` (JSON)',
				description:
					"Create a new blank version (name: 'New Version') for the character, attached to the first available company"
			},
			{
				method: 'GET',
				path: '/api/characters/[characterId]/versions/[versionId]',
				auth: 'admin',
				returns: '`CharacterVersionFull` (JSON; 404 if not found)',
				description:
					'Get a version resolved with full skill/item/implant/company objects (`events` is hardcoded to `[]`)'
			},
			{
				method: 'POST',
				path: '/api/characters/[characterId]/versions/[versionId]',
				auth: 'admin',
				returns: 'empty body (200)',
				description:
					'Update a version; body: `CharacterVersionFull` (requires `body.company.id`; skills/items/implants are stripped back to `{id, value|count|slot}` before saving)'
			}
		]
	},
	{
		title: 'Character Versions',
		endpoints: [
			{
				method: 'PUT',
				path: '/api/characters/versions',
				auth: 'user',
				returns: '`{ id: number }` (JSON)',
				description: 'Create character version; body: `CharacterVersionBare`'
			},
			{
				method: 'GET',
				path: '/api/characters/versions/[versionId]',
				auth: 'user',
				returns: '`CharacterVersionBare | null` (JSON; null when not found)',
				description: 'Get character version by ID'
			},
			{
				method: 'PUT',
				path: '/api/characters/versions/[versionId]',
				auth: 'user',
				returns: '`number` (JSON-encoded id)',
				description: 'Update character version; body: `CharacterVersionBare`'
			},
			{
				method: 'GET',
				path: '/api/characters/versions/[versionId]/full',
				auth: 'user',
				returns: '`{}` (JSON)',
				description: 'Get full version detail — not yet implemented'
			},
			{
				method: 'PUT',
				path: '/api/characters/versions/[versionId]/skills',
				auth: 'user',
				returns: 'empty body (200)',
				description: 'Replace version skills; body: `CharacterVersionSkill[]`'
			}
		]
	},
	{
		title: 'Events',
		note: 'Event dates (`start`, `end`) are sent as ISO strings and converted to `Date` objects before validation. `LarpEvent` also carries `formId?: string | null` — the bare Google Form ID (no URL) attached to this event — and `sheetId?: string | null` — the linked Google Spreadsheet ID for responses (server-assigned, not set by the admin UI). Saving an event with `formId` set and `sheetId` null eagerly creates the response spreadsheet in Drive folder `1fxhnT9gEr6CWyfBgGQ1ZWYoGkpLH4c-J` and persists its ID.',
		endpoints: [
			{
				method: 'GET',
				path: '/api/events',
				auth: 'admin',
				returns: '`LarpEvent[]` (JSON)',
				description: 'List all events'
			},
			{
				method: 'PUT',
				path: '/api/events',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Create event; body: `LarpEvent` (dates as ISO strings)'
			},
			{
				method: 'GET',
				path: '/api/events/open',
				auth: 'admin/user',
				returns: '`LarpEvent[]` (JSON)',
				description: "List events with status 'Open'"
			},
			{
				method: 'GET',
				path: '/api/events/[eventId]',
				auth: 'admin/user',
				returns: '`LarpEvent` (JSON; 404 if not found)',
				description: 'Get event by ID'
			},
			{
				method: 'POST',
				path: '/api/events/[eventId]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Update event; body: `LarpEvent` (dates as ISO strings)'
			},
			{
				method: 'DELETE',
				path: '/api/events/[eventId]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Delete event'
			}
		]
	},
	{
		title: 'Event Participants',
		endpoints: [
			{
				method: 'GET',
				path: '/api/events/[eventId]/participants',
				auth: 'admin',
				returns: '`Character[]` (JSON) — repo returns the characters playing in this event',
				description: 'List all participants for event'
			},
			{
				method: 'PUT',
				path: '/api/events/[eventId]/participants',
				auth: 'admin',
				returns: 'empty body (200)',
				description:
					'Register a participant; body: `CharacterWithVersions` (`{ id: number | null, name, ownerId, ownerName, versions: CharacterVersionBare[] }`). Creates the character when `id` is null, otherwise updates it; then creates/updates the last entry in `versions` (create when its `id` is null) and registers that version for the event under `ownerId`'
			},
			{
				method: 'DELETE',
				path: '/api/events/[eventId]/participants',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Remove participant; body: `EventParticipant` (`{ eventId, userId, characterVersion }`)'
			},
			{
				method: 'GET',
				path: '/api/events/[eventId]/participants/characters/[characterId]',
				auth: 'user',
				returns: '`EventParticipant | null` (JSON; null when not found)',
				description: 'Get participation record for a specific character'
			}
		]
	},
	{
		title: 'Event Budget',
		endpoints: [
			{
				method: 'GET',
				path: '/api/events/[eventId]/budget',
				auth: 'admin',
				returns: 'per-character budget rows (JSON)',
				description: 'Get all budget rows for the event'
			},
			{
				method: 'GET',
				path: '/api/events/[eventId]/budget/characters/[characterId]',
				auth: 'admin/user',
				returns: '`{ budget: number }` (JSON)',
				description: 'Get the budget for a character at an event'
			},
			{
				method: 'POST',
				path: '/api/events/[eventId]/budget/characters/[characterId]',
				auth: 'admin',
				returns: 'empty body (200)',
				description: 'Set the budget for a character at an event; body: `{ budget: number }` (400 if not a number)'
			}
		]
	},
	{
		title: 'Forms (Google Forms integration)',
		note: "Form submission is no longer a public Forms-API call. It writes a row to the event's linked Google Sheet via `POST /api/my/events/[eventId]/form-submit` (see the \"My\" section). The sheet is created in workspace Drive folder `1fxhnT9gEr6CWyfBgGQ1ZWYoGkpLH4c-J` and its ID is stored on `Events.SheetId`.",
		endpoints: [
			{
				method: 'GET',
				path: '/api/forms/[formId]',
				auth: 'Public',
				returns: '`GoogleForm` (JSON)',
				description: "Fetch a Google Form's structure"
			}
		]
	},
	{
		title: 'Drive (Google Drive integration)',
		note: 'All drive endpoints are public (no auth). Responses are non-JSON where noted.',
		endpoints: [
			{
				method: 'GET',
				path: '/api/drive/search?q=<query>',
				auth: 'Public',
				returns: '`DriveFile[]` (JSON; `[]` if query < 2 chars)',
				description: 'Search Drive files'
			},
			{
				method: 'GET',
				path: '/api/drive/[fileId]',
				auth: 'Public',
				returns:
					'`ReadableStream` — `Content-Type: application/pdf`, `Cache-Control: private, max-age=3600`',
				description: 'Stream file as PDF'
			},
			{
				method: 'GET',
				path: '/api/drive/[fileId]/dir',
				auth: 'Public',
				returns: '`DriveFile[]` (JSON)',
				description: 'List files in a Drive folder'
			},
			{
				method: 'GET',
				path: '/api/drive/[fileId]/doc',
				auth: 'Public',
				returns: '`string` — `Content-Type: text/html; charset=utf-8`, `Cache-Control: no-store`',
				description: 'Export Google Doc as HTML; black/white colors are inverted for dark-mode compatibility'
			}
		]
	},
	{
		title: 'My (current-user scoped)',
		note: "All endpoints under `/api/my/...` operate on the authenticated user. Auth: `user` role unless stated otherwise. Use these instead of branching on roles inside a shared handler.",
		endpoints: [
			{
				method: 'GET',
				path: '/api/my/user',
				auth: 'user',
				returns: '`User` (JSON)',
				description: 'Get the currently authenticated user'
			},
			{
				method: 'GET',
				path: '/api/my/characters',
				auth: 'user',
				returns: '`Character[]` (JSON)',
				description: 'List characters owned by the current user'
			},
			{
				method: 'GET',
				path: '/api/my/characters/with-events',
				auth: 'user',
				returns: '`(Character & { events: Array<{ id: number, name: string }> })[]` (JSON)',
				description: "List the current user's characters, each with an `events` array"
			},
			{
				method: 'GET',
				path: '/api/my/characters/versions',
				auth: 'user',
				returns:
					'`MyCharacterVersionsResponse` (JSON) — `{ characters: (Character & { versions: CharacterVersionFull[] })[] }` where each version\'s `skills`/`items`/`implants` are joined with the catalog and `events` is the list of events the version is registered for',
				description:
					"List the current user's characters with their versions, each version's skill/item/implant IDs resolved to full catalog entries plus the events the version is registered for"
			},
			{
				method: 'GET',
				path: '/api/my/events/[eventId]/participants',
				auth: 'user',
				returns:
					'`{ characterId: number, characterVersionId: number }` (JSON, 200) or empty body (204 when not registered)',
				description: "Get the current user's participation for an event"
			},
			{
				method: 'POST',
				path: '/api/my/events/[eventId]/participants',
				auth: 'user',
				returns: 'empty body (201)',
				description:
					'Register the current user for an event; body: `{ draft: CharacterDraft }` where `CharacterDraft = { id: number | null; name: string; version: { id: number | null; name; skills; items; implants } }`. Handles three flows in one call based on which ids are null: new character, new version on existing character, update existing version. Renames the character if `name` differs. Ownership-checked'
			},
			{
				method: 'POST',
				path: '/api/my/events/[eventId]/form-submit',
				auth: 'user',
				returns: '`{ ok: true, status: 200 }` (JSON)',
				description:
					"Append the current user's Google Form answers as a row in the event's linked spreadsheet. Body: `AnswerMap` (`Record<string, string | string[]>` keyed by `questionId`). Returns 404 if the event has no `formId`. Row layout: `[ISO timestamp, userId, name, email, ...answers in form order]`. If the form's question titles no longer match the latest tab's header, a new `Responses <ISO>` tab is added to the same spreadsheet"
			},
			{
				method: 'GET',
				path: '/api/my/backgrounds',
				auth: 'user',
				returns:
					"`{ id: string, name: string, mimeType: 'application/vnd.google-apps.document' }[]` (JSON)",
				description:
					"List the current user's characters that have a backstory doc, shaped like Drive files for UI reuse (name is \"<CharName> - Backstory\")"
			},
			{
				method: 'POST',
				path: '/api/my/characters/backstory',
				auth: 'user',
				returns: '`{ id: string }` (JSON — Google Doc ID)',
				description:
					'Create a new Google Doc backstory (not yet linked to a character record); body: `{ characterName: string }` (400 if empty/non-string)'
			}
		]
	}
];
