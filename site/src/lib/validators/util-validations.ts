export function isString<T>(value: T) {
    if (typeof value !== 'string') return { valid: false, value, isString: false};
    return { valid: true, value };
}

export function isNotEmptyString<T>(value: T) {
    const isStringResult = isString(value);
    if (isStringResult.valid === false) return isStringResult;
    if (value === '') return { valid: false, value, isNotEmptyString: false };
    return { valid: true, value: value as string };
}


export function isEmail<T>(value: T) {
    const isNotEmptyResult = isNotEmptyString(value);
    if (isNotEmptyResult.valid === false) return isNotEmptyResult;
    if ((isNotEmptyResult.value as string).match(/^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/g) === null)
        return { valid: false, value: isNotEmptyResult.value, isEmail: false };
    return { valid: true, value: isNotEmptyResult.value};
}



