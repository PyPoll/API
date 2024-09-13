import Config from "tools/Config.ts";
import { TokenData, TokenUtils } from "tools/Token.ts";
import { type Response } from "express";
import { respond, respondError, ResponseMessage } from "tools/Responses.ts";
import Lang from "tools/Lang.ts";
import HTTPError from "errors/HTTPError.ts";
import { prisma } from "index.ts";
import { PrivateUser, User } from "models/User.ts";
import { getUserInfos } from "tools/Portal.ts";

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

export async function createOrLoginFurWazUser(furwazId: number, forcedPseudo?: string, forcedEmail?: string): Promise<{user: PrivateUser, conflict: any}> {
    const furwazExists = await prisma.user.findFirst({ where: { furwazId } });
    if (furwazExists) return {user: User.makePrivate(furwazExists), conflict: undefined};

    const res = await fetch(`https://${Config.mainAPIHost}/users/${furwazId}`, {
        headers: { "Content-Type": "application/json", }
    });
    const json = await res.json() as any;
    const furwazUser = json.data;

    const finalEmail = forcedEmail ?? furwazUser.email;
    const finalPseudo = forcedPseudo ?? furwazUser.pseudo;

    const dbExists = await prisma.user.findFirst({ where: { OR: [
        {email: finalEmail},
        {pseudo: finalPseudo}
    ]}});

    const data: any = {};
    if (dbExists) {
        data.conflict = {
            pseudo: dbExists.pseudo === finalPseudo ? finalPseudo : undefined,
            email: dbExists.email === finalEmail ? finalEmail : undefined
        };
    } else {
        data.user = User.makePrivate(await prisma.user.create({
            data: { furwazId, pseudo: finalPseudo, email: finalEmail }
        }));
    }

    return data;
}

export async function linkFurWazAccount(userId: number, portalToken: string) {
    const portalUserInfos = await getUserInfos(portalToken);
    if (!portalUserInfos) throw HTTPError.BadRequest();

    const user = await prisma.user.findFirst({ where: { id: userId } });
    if (!user) throw User.MESSAGES.NOT_FOUND().buildHTTPError();

    if (user.furwazId) throw HTTPError.Conflict();

    return await prisma.user.update({
        where: { id: userId },
        data: { furwazId: portalUserInfos.id }
    });
}

export async function unlinkFurWazAccount(userId: number) {
    const user = await prisma.user.findFirst({ where: { id: userId } });
    if (!user) throw User.MESSAGES.NOT_FOUND().buildHTTPError();

    if (!user.furwazId) throw HTTPError.BadRequest();

    return await prisma.user.update({
        where: { id: userId },
        data: { furwazId: null }
    });
}
