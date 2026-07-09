export const PublicUserRole = {
    user : 'user',
    player : 'player',
    extra : 'extra',
} as const;
export type PublicUserRole = typeof PublicUserRole[keyof typeof PublicUserRole];
export function isPublicUserRole(role: unknown): role is PublicUserRole{
    return (
        typeof role === 'string' &&
        Object.values(PublicUserRole).includes(role as PublicUserRole)
    )
}

export const UserRole = {
    ...PublicUserRole,
    admin : 'admin',
} as const
export type UserRole = typeof UserRole[keyof typeof UserRole];

export function isUserRole(role: unknown): role is UserRole {
    return (
        typeof role === 'string' &&
        Object.values(UserRole).includes(role as UserRole)
    )
}
