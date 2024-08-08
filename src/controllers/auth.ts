import Config from "tools/Config.ts";
import { TokenData, TokenUtils } from "tools/Token.ts";
import { type Response } from "express";
import { respond, respondError, ResponseMessage } from "tools/Responses.ts";
import Lang from "tools/Lang.ts";
import HTTPError from "errors/HTTPError.ts";
import { prisma } from "index.ts";
import { User } from "models/User.ts";

type EmailPollingData = {
    response: Response
};

const emailPollingRequests: { [email: string]: EmailPollingData } = {};

export async function createUserToken(userId: number) {
    const user = await prisma.user.findFirst({ where: { id: userId } });
    if (!user) throw User.MESSAGES.NOT_FOUND().buildHTTPError();

    return await TokenUtils.encode({
        id: user.id,
        expiration: Config.security.tokenExpiration
    });
}

export async function createLoginPollingToken(userEmail: string) {
    return TokenUtils.encode({
        id: -1,
        payload: { type: 'loginPolling', email: userEmail },
        expiration: '24h'
    });
}

export function checkLoginPollingToken(token: TokenData) {
    return token.payload?.type === 'loginPolling' && typeof(token.payload?.email) === 'string';
}

export async function completeLoginPolling(email: string, userToken: string) {
    if (emailPollingRequests[email]) {
        respond(
            emailPollingRequests[email].response,
            new ResponseMessage(
                Lang.GetText(Lang.CreateTranslationContext('responses', 'LoggedIn')),
                200
            ),
            userToken
        );
        delete emailPollingRequests[email];
    }
}

export function addEmailPollingRequest(email: string, response: Response) {
    emailPollingRequests[email] = { response };
    setTimeout(() => {
        if (emailPollingRequests[email]) {
            respondError(
                emailPollingRequests[email].response,
                new HTTPError(504, 'Login polling timeout')
            );
            delete emailPollingRequests[email];
        }
    }, 1000 * 30); // 30 seconds
}
