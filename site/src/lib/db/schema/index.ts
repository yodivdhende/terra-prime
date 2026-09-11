/**
 * Drizzle schema for the Terra Prime database, split by domain.
 *
 * | module          | contents                                                    |
 * |-----------------|-------------------------------------------------------------|
 * | `auth.ts`       | users, admins, sessions, messages, e-mail tokens             |
 * | `catalog.ts`    | expertise (+groups, point costs), items, implants            |
 * | `companies.ts`  | companies and their discount tables                          |
 * | `characters.ts` | characters, versions, version contents, access grants, party |
 * | `events.ts`     | events, participants, coupons                                |
 * | `missions.ts`   | missions, participants, printer devices                      |
 * | `relations.ts`  | relations for the relational query API                       |
 *
 * Modules import in one direction only — `auth`/`catalog` -> `companies` -> `characters` ->
 * `events`/`missions` — which matches the foreign-key graph and keeps the module graph acyclic.
 *
 * The physical schema predates Drizzle: tables and columns are PascalCase, so every column
 * declares its database name explicitly and exposes a camelCase TypeScript property. Index and
 * foreign-key constraint names are pinned to the names the pre-Drizzle migrations created, so the
 * generated baseline in `drizzle/` matches existing dev, staging, and production databases exactly.
 *
 * Indexes MySQL creates implicitly for a foreign key (where the index name equals the constraint
 * name) are not declared — adding the foreign key creates them.
 */
export * from './enums';
export * from './auth';
export * from './catalog';
export * from './companies';
export * from './characters';
export * from './events';
export * from './missions';
export * from './relations';
