/**
 * Relations for Drizzle's relational query API (`db.query.*`).
 *
 * These are kept in one file because the relation graph is cyclic (users have characters,
 * characters have an owner) while the table definitions are not. `relations()` takes a callback,
 * so the cross-references inside are resolved lazily and the cycle never reaches module load.
 *
 * Note: the repositories do not currently use `db.query.*` — for MySQL it compiles to
 * `LEFT JOIN LATERAL` + `json_arrayagg`, which MariaDB rejects. See `character_version.repo.ts`.
 */
import { relations } from 'drizzle-orm';
import {
	users,
	admins,
	sessions,
	sessionRoles,
	messages,
	emailVerificationTokens,
	passwordResetTokens
} from './auth';
import { expertiseGroups, expertise, items, implants } from './catalog';
import {
	companies,
	companyDiscountsItems,
	companyDiscountsImplants,
	companyDiscountsExpertise
} from './companies';
import {
	characters,
	characterVersions,
	characterVersionExpertise,
	characterVersionImplants,
	characterVersionItems,
	itemCharacterAccess,
	implantCharacterAccess,
	expertiseCharacterAccess,
	party,
	partyMembers
} from './characters';
import { events, eventParticipants, eventCoupons } from './events';

export const usersRelations = relations(users, ({ many }) => ({
	admin: many(admins),
	characters: many(characters),
	sessions: many(sessions),
	eventParticipations: many(eventParticipants),
	eventCoupons: many(eventCoupons),
	emailVerificationTokens: many(emailVerificationTokens),
	passwordResetTokens: many(passwordResetTokens)
}));

export const adminsRelations = relations(admins, ({ one }) => ({
	user: one(users, { fields: [admins.userId], references: [users.id] })
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
	owner: one(users, { fields: [characters.owner], references: [users.id] }),
	versions: many(characterVersions),
	partyMemberships: many(partyMembers),
	itemAccess: many(itemCharacterAccess),
	implantAccess: many(implantCharacterAccess),
	expertiseAccess: many(expertiseCharacterAccess)
}));

export const characterVersionsRelations = relations(characterVersions, ({ one, many }) => ({
	character: one(characters, {
		fields: [characterVersions.characterId],
		references: [characters.id]
	}),
	company: one(companies, {
		fields: [characterVersions.companyId],
		references: [companies.id]
	}),
	expertise: many(characterVersionExpertise),
	implants: many(characterVersionImplants),
	items: many(characterVersionItems),
	eventParticipations: many(eventParticipants)
}));

export const companiesRelations = relations(companies, ({ many }) => ({
	characterVersions: many(characterVersions),
	itemDiscounts: many(companyDiscountsItems),
	implantDiscounts: many(companyDiscountsImplants),
	expertiseDiscounts: many(companyDiscountsExpertise)
}));

export const expertiseRelations = relations(expertise, ({ one, many }) => ({
	group: one(expertiseGroups, {
		fields: [expertise.groupId],
		references: [expertiseGroups.id]
	}),
	characterVersions: many(characterVersionExpertise),
	companyDiscounts: many(companyDiscountsExpertise),
	characterAccess: many(expertiseCharacterAccess)
}));

export const expertiseGroupsRelations = relations(expertiseGroups, ({ many }) => ({
	expertise: many(expertise)
}));

export const itemsRelations = relations(items, ({ many }) => ({
	characterVersions: many(characterVersionItems),
	companyDiscounts: many(companyDiscountsItems),
	characterAccess: many(itemCharacterAccess)
}));

export const implantsRelations = relations(implants, ({ many }) => ({
	characterVersions: many(characterVersionImplants),
	companyDiscounts: many(companyDiscountsImplants),
	characterAccess: many(implantCharacterAccess)
}));

export const characterVersionExpertiseRelations = relations(
	characterVersionExpertise,
	({ one }) => ({
		characterVersion: one(characterVersions, {
			fields: [characterVersionExpertise.characterVersionId],
			references: [characterVersions.id]
		}),
		expertise: one(expertise, {
			fields: [characterVersionExpertise.expertiseId],
			references: [expertise.id]
		})
	})
);

export const characterVersionImplantsRelations = relations(characterVersionImplants, ({ one }) => ({
	characterVersion: one(characterVersions, {
		fields: [characterVersionImplants.characterVersionId],
		references: [characterVersions.id]
	}),
	implant: one(implants, {
		fields: [characterVersionImplants.implantId],
		references: [implants.id]
	})
}));

export const characterVersionItemsRelations = relations(characterVersionItems, ({ one }) => ({
	characterVersion: one(characterVersions, {
		fields: [characterVersionItems.characterVersionId],
		references: [characterVersions.id]
	}),
	item: one(items, { fields: [characterVersionItems.itemId], references: [items.id] })
}));

export const eventsRelations = relations(events, ({ many }) => ({
	participants: many(eventParticipants),
	coupons: many(eventCoupons)
}));

export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
	event: one(events, { fields: [eventParticipants.eventId], references: [events.id] }),
	user: one(users, { fields: [eventParticipants.userId], references: [users.id] }),
	characterVersion: one(characterVersions, {
		fields: [eventParticipants.characterVersionId],
		references: [characterVersions.id]
	})
}));

export const eventCouponsRelations = relations(eventCoupons, ({ one }) => ({
	event: one(events, { fields: [eventCoupons.eventId], references: [events.id] }),
	user: one(users, { fields: [eventCoupons.userId], references: [users.id] })
}));

export const companyDiscountsItemsRelations = relations(companyDiscountsItems, ({ one }) => ({
	company: one(companies, {
		fields: [companyDiscountsItems.companyId],
		references: [companies.id]
	}),
	item: one(items, { fields: [companyDiscountsItems.itemId], references: [items.id] })
}));

export const companyDiscountsImplantsRelations = relations(companyDiscountsImplants, ({ one }) => ({
	company: one(companies, {
		fields: [companyDiscountsImplants.companyId],
		references: [companies.id]
	}),
	implant: one(implants, {
		fields: [companyDiscountsImplants.implantId],
		references: [implants.id]
	})
}));

export const companyDiscountsExpertiseRelations = relations(
	companyDiscountsExpertise,
	({ one }) => ({
		company: one(companies, {
			fields: [companyDiscountsExpertise.companyId],
			references: [companies.id]
		}),
		expertise: one(expertise, {
			fields: [companyDiscountsExpertise.expertiseId],
			references: [expertise.id]
		})
	})
);

export const itemCharacterAccessRelations = relations(itemCharacterAccess, ({ one }) => ({
	item: one(items, { fields: [itemCharacterAccess.itemId], references: [items.id] }),
	character: one(characters, {
		fields: [itemCharacterAccess.characterId],
		references: [characters.id]
	})
}));

export const implantCharacterAccessRelations = relations(implantCharacterAccess, ({ one }) => ({
	implant: one(implants, { fields: [implantCharacterAccess.implantId], references: [implants.id] }),
	character: one(characters, {
		fields: [implantCharacterAccess.characterId],
		references: [characters.id]
	})
}));

export const expertiseCharacterAccessRelations = relations(expertiseCharacterAccess, ({ one }) => ({
	expertise: one(expertise, {
		fields: [expertiseCharacterAccess.expertiseId],
		references: [expertise.id]
	}),
	character: one(characters, {
		fields: [expertiseCharacterAccess.characterId],
		references: [characters.id]
	})
}));

export const partyRelations = relations(party, ({ many }) => ({
	members: many(partyMembers)
}));

export const partyMembersRelations = relations(partyMembers, ({ one }) => ({
	party: one(party, { fields: [partyMembers.partyId], references: [party.id] }),
	member: one(characters, { fields: [partyMembers.memberId], references: [characters.id] })
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
	roles: many(sessionRoles)
}));

export const sessionRolesRelations = relations(sessionRoles, ({ one }) => ({
	session: one(sessions, { fields: [sessionRoles.token], references: [sessions.token] })
}));

export const messagesRelations = relations(messages, ({ one }) => ({
	senderUser: one(users, { fields: [messages.sender], references: [users.id] }),
	recipientUser: one(users, { fields: [messages.recipient], references: [users.id] })
}));

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
	user: one(users, { fields: [emailVerificationTokens.userId], references: [users.id] })
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
	user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] })
}));
