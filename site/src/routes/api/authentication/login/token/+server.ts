import { RequestError } from "$lib/types/errors";
import { setSessionToken } from "$lib/utils/cookies";
import { handleRequest } from "$lib/utils/request";
import { json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, cookies}) => {
    return handleRequest(async ()=>{
        const {token} = await request.json();
        if(typeof token !== 'string'){
			throw new RequestError(400, 'not a valid token');
        }
        //TODO: search roles for Token
        setSessionToken(cookies, token);
        return json({token});
    })
 }