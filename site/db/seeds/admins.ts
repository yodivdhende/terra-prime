import type { admins } from '../../src/lib/db/schema';

export const rows: (typeof admins.$inferInsert)[] = [{ userId: 1 }];
