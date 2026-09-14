/** Column enum values shared across the schema modules. */
export const characterAccess = ['all', 'none', 'specific'] as const;
export const eventStatus = ['Draft', 'Open', 'Live', 'Canceled', 'Done'] as const;
export const missionStatus = ['open', 'closed'] as const;
