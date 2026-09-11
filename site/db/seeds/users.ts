import type { users } from '../../src/lib/db/schema';

export const rows: (typeof users.$inferInsert)[] = [
	{
		id: 1,
		name: 'Yodi',
		email: 'yodi.vandenhende@gmail.com',
		password: '$2b$13$evbfN7v/BJgCDtmdftgnyOgHvoUt3JZuZZnqvBjne6YMbXHLS9ReW'
	},
	{
		id: 2,
		name: 'Player2',
		email: 'yodi.vandenhende+player2@gmail.com',
		password: '$2b$13$evbfN7v/BJgCDtmdftgnyOgHvoUt3JZuZZnqvBjne6YMbXHLS9ReW'
	},
	{
		id: 3,
		name: 'Player3',
		email: 'yodi.vandenhende+player3@gmail.com',
		password: '$2b$13$evbfN7v/BJgCDtmdftgnyOgHvoUt3JZuZZnqvBjne6YMbXHLS9ReW'
	},
	{
		id: 4,
		name: 'Player4',
		email: 'yodi.vandenhende+player4@gmail.com',
		password: '$2b$13$evbfN7v/BJgCDtmdftgnyOgHvoUt3JZuZZnqvBjne6YMbXHLS9ReW'
	},
	{
		id: 5,
		name: 'Extra5',
		email: 'yodi.vandenhende+extra5@gmail.com',
		password: '$2b$13$evbfN7v/BJgCDtmdftgnyOgHvoUt3JZuZZnqvBjne6YMbXHLS9ReW'
	},
	{
		id: 6,
		name: 'Extra6',
		email: 'yodi.vandenhende+extra6@gmail.com',
		password: '$2b$13$evbfN7v/BJgCDtmdftgnyOgHvoUt3JZuZZnqvBjne6YMbXHLS9ReW'
	},
	{
		id: 7,
		name: 'Extra7',
		email: 'yodi.vandenhende+extra7@gmail.com',
		password: '$2b$13$evbfN7v/BJgCDtmdftgnyOgHvoUt3JZuZZnqvBjne6YMbXHLS9ReW'
	}
];
