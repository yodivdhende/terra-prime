import { error } from "@sveltejs/kit";

export function isNumberOrError(id: unknown): number{
    if(id == null || typeof id != 'string') return error(400, "invalid id");
    const idNumber = Number(id);
    if(Number.isNaN(idNumber)) return error(400, "invalid id")
    return idNumber;
};

export function isNumberNullOrError(id: unknown): number | null{
    if(id == null) return null;
    if(typeof id != 'string') return error(400, "invalid id");
    const idNumber = Number(id);
    if(Number.isNaN(idNumber)) return error(400, "invalid id")
    return idNumber;
};