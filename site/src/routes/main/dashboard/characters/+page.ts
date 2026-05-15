import type { PageLoad } from './$types';

export const load: PageLoad= async ({fetch}) =>{
    const charactersRespone = await fetch('/api/my/characters');
    return { characters: await charactersRespone.json() };
} 