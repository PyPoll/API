import { prisma } from '../index.ts';
import HTTP from 'tools/HTTP.ts';
import Lang from 'tools/Lang.ts';
import HTTPError from 'errors/HTTPError.ts';
import { User } from 'models/User.ts';
import Mailer from 'tools/Mailer.ts';
import Mail from 'tools/Mail.ts';
import { getRootDir } from 'index.ts';
import Config from 'tools/Config.ts';
import { rmUnverifiedUser } from 'tools/Tasks.ts';
import { Timer } from 'tools/Timer.ts';
import { TokenData, TokenUtils } from 'tools/Token.ts';
import { createUserToken, completeLoginPolling } from './auth.ts';
import * as bigData from './bigData.ts';
import { Poll } from 'models/Poll.ts';

async function createEmailLoginToken(userId: number) {
    return TokenUtils.encode({
        id: userId,
        payload: { type: 'emailLogin' },
        expiration: '24h'
    });
}
async function createEmailChangeToken(userId: number, email: string) {
    return TokenUtils.encode({
        id: userId,
        payload: { type: 'emailChange', email },
        expiration: '24h'
    });
}
function checkEmailLoginToken(data: TokenData) {
    return data.payload?.type === 'emailLogin';
}
function checkEmailChangeToken(data: TokenData) {
    return data.payload?.type === 'emailChange' && typeof(data.payload?.email) === 'string';
}

async function sendEmailChange(userId: number, oldEmail: string, newEmail: string, sendToNew=false) {
    const token = await createEmailChangeToken(userId, newEmail);
    Mailer.sendMail(
        sendToNew? newEmail : oldEmail,
        Mail.fromFile(
            Lang.GetText(Lang.CreateTranslationContext('emailChange', 'Title')),
            getRootDir() + 'mails/emailButton.html',
            getRootDir() + 'mails/emailButton.txt',
            {
                Title: Lang.GetText(Lang.CreateTranslationContext('emailChange', 'Title')),
                FloorText1: Lang.GetText(Lang.CreateTranslationContext('emailChange', 'FloorText1')),
                FloorText2: Lang.GetText(Lang.CreateTranslationContext('emailChange', 'FloorText2')),
                ButtonText: Lang.GetText(Lang.CreateTranslationContext('emailChange', 'ButtonText')),
                GroundText: Lang.GetText(Lang.CreateTranslationContext('emailChange', 'GroundText')),
                Footer1: Lang.GetText(Lang.CreateTranslationContext('emailChange', 'Footer1')),
                Footer2: Lang.GetText(Lang.CreateTranslationContext('emailChange', 'Footer2')),
                ButtonLink: `https://${Config.webHost}/emailChange?token=${token}`
            }
        )
    );
}

export async function sendEmailLogin(email: string, userId: number|undefined = undefined) {
    if (userId === undefined) {
        userId = await prisma.user.findUnique({ where: { email } }).then(user => user?.id);
    }
    if (userId === undefined) {
        throw User.MESSAGES.NOT_FOUND().buildHTTPError();
    }

    const token = await createEmailLoginToken(userId);
    Mailer.sendMail(
        email,
        Mail.fromFile(
            Lang.GetText(Lang.CreateTranslationContext('emailLogin', 'Title')),
            getRootDir() + 'mails/emailButton.html',
            getRootDir() + 'mails/emailButton.txt',
            {
                Title: Lang.GetText(Lang.CreateTranslationContext('emailLogin', 'Title')),
                FloorText1: Lang.GetText(Lang.CreateTranslationContext('emailLogin', 'FloorText1')),
                FloorText2: Lang.GetText(Lang.CreateTranslationContext('emailLogin', 'FloorText2')),
                ButtonText: Lang.GetText(Lang.CreateTranslationContext('emailLogin', 'ButtonText')),
                GroundText: Lang.GetText(Lang.CreateTranslationContext('emailLogin', 'GroundText')),
                Footer1: Lang.GetText(Lang.CreateTranslationContext('emailLogin', 'Footer1')),
                Footer2: Lang.GetText(Lang.CreateTranslationContext('emailLogin', 'Footer2')),
                ButtonLink: `https://${Config.webHost}/emailLogin?token=${token}`
            }
        )
    );
}

export async function sendEmailRegister(email: string, userId: number|undefined = undefined) {
    if (userId === undefined) {
        userId = await prisma.user.findUnique({ where: { email } }).then(user => user?.id);
    }
    if (userId === undefined) {
        throw User.MESSAGES.NOT_FOUND().buildHTTPError();
    }

    const token = await createEmailLoginToken(userId);
    Mailer.sendMail(
        email,
        Mail.fromFile(
            Lang.GetText(Lang.CreateTranslationContext('emailRegister', 'Title')),
            getRootDir() + 'mails/emailButton.html',
            getRootDir() + 'mails/emailButton.txt',
            {
                Title: Lang.GetText(Lang.CreateTranslationContext('emailRegister', 'Title')),
                FloorText1: Lang.GetText(Lang.CreateTranslationContext('emailRegister', 'FloorText1')),
                FloorText2: Lang.GetText(Lang.CreateTranslationContext('emailRegister', 'FloorText2')),
                ButtonText: Lang.GetText(Lang.CreateTranslationContext('emailRegister', 'ButtonText')),
                GroundText: Lang.GetText(Lang.CreateTranslationContext('emailRegister', 'GroundText')),
                Footer1: Lang.GetText(Lang.CreateTranslationContext('emailRegister', 'Footer1')),
                Footer2: Lang.GetText(Lang.CreateTranslationContext('emailRegister', 'Footer2')),
                ButtonLink: `https://${Config.webHost}/emailLogin?token=${token}`
            }
        )
    );
}

/**
 * Creates a new user and returns it if successful, throws an error otherwise
 * @param pseudo The user pseudo
 * @param email The user email address (must be unique)
 * @param password The user plain password
 * @returns The created user (as a PrivateUser)
 */
export async function createUser(pseudo: string, email: string) {
    const user = await prisma.user.findFirst({ where: { OR: [ {email}, {pseudo} ] } });
    
    // If user already exists, throw an error
    if (user !== null) {
        throw new HTTPError(
            HTTP.CONFLICT,
            Lang.GetText(Lang.CreateTranslationContext(
                'errors',
                'AlreadyExists',
                { resource: Lang.GetText(Lang.CreateTranslationContext('models', 'User')) }
            ))
        );
    }

    // Create user
    const newUser = await prisma.user.create({ data: { pseudo, email } });

    // send mail to register user with it
    sendEmailRegister(email, newUser.id);

    // register task to delete user in 24 hour if not email-verified
    Timer.addTask(rmUnverifiedUser.createTask(newUser.id));

    return User.makePrivate(newUser);
}

export async function createDevice() {
    const maxIter = 10;
    
    let pseudo: string;
    let iter = 0;
    do {
        pseudo = 'Octopus #' + Math.floor(Math.random() * 1000);
        const exists = await prisma.user.findFirst({ where: { pseudo } });
        if (exists === null) break;
    } while (iter++ < maxIter);

    if (iter >= maxIter) {
        throw HTTPError.InternalServerError();
    }

    const newUser = await prisma.user.create({ data: { pseudo } });
    return User.makePrivate(newUser);
}

/**
 * Get a user token from an email token
 * @param token email login token
 * @returns A new user token if the email token is valid, throws an error otherwise
 */
export async function emailLogin(token: string) {
    const data = await TokenUtils.decode(token);
    if (!checkEmailLoginToken(data))
        throw HTTPError.InvalidToken();

    const user = await prisma.user.findUnique({ where: { id: data.id } });
    if (user === null)
        throw User.MESSAGES.NOT_FOUND().buildHTTPError();

    await prisma.user.update({ where: { id: data.id }, data: { emailValid: true } });
    const userToken = await createUserToken(data.id);

    if (user.email) {
        completeLoginPolling(user.email, userToken);
    }
    return userToken;
}

/**
 * Change a user email with an email change token
 * @param token email change token
 * @returns true if the email change has been successful, throws an error otherwise
 */
export async function emailChange(token: string) {
    const data = await TokenUtils.decode(token);
    if (!checkEmailChangeToken(data))
        throw HTTPError.InvalidToken();

    const user = await prisma.user.findUnique({ where: { id: data.id } });
    if (user === null)
        throw User.MESSAGES.NOT_FOUND().buildHTTPError();

    const newEmail = data.payload.email;
    const exists = await prisma.user.findFirst({ where: { email: newEmail } });
    if (exists !== null) {
        throw new HTTPError(
            HTTP.CONFLICT,
            Lang.GetText(Lang.CreateTranslationContext(
                'errors',
                'AlreadyExists',
                { resource: Lang.GetText(Lang.CreateTranslationContext('models', 'User')) }
            ))
        );
    }

    await prisma.user.update({ where: { id: data.id }, data: { email: newEmail } });
    return true;
}

export async function updateUser(id: number, pseudo: string|undefined, email: string|undefined, bio: string|undefined) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user === null)
        throw User.MESSAGES.NOT_FOUND().buildHTTPError();

    const infos: any = {};
    if (bio !== undefined) infos.bio = bio;
    if (pseudo !== undefined) infos.pseudo = pseudo;
    if (email !== undefined && email !== user.email) {
        // check if email already exists
        const exists = await prisma.user.findFirst({ where: { email } });
        if (exists !== null) {
            throw new HTTPError(
                HTTP.CONFLICT,
                Lang.GetText(Lang.CreateTranslationContext(
                    'errors',
                    'AlreadyExists',
                    { resource: Lang.GetText(Lang.CreateTranslationContext('models', 'User')) }
                ))
            );
        }
        if (user.email) {
            // send an email change mail
            sendEmailChange(id, user.email, email);
        }
        else {
            // no email = device account creating its user, so we send a welcome mail
            prisma.user.update({ where: { id }, data: { email } });
            sendEmailRegister(email, id);
        }
    }

    if (Object.keys(infos).length > 0)
        return await prisma.user.update({ where: { id }, data: infos });
    return user;
}

export async function deleteUser(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user === null)
        throw User.MESSAGES.NOT_FOUND().buildHTTPError();

    // update followers and following counters
    const followingUsers = await prisma.follow.findMany({ where: { followerId: id } });
    const followedUsers = await prisma.follow.findMany({ where: { followedId: id } });
    const followingIds = followingUsers.map(f => f.followedId);
    const followedIds = followedUsers.map(f => f.followerId);
    await prisma.user.updateMany({ where: { id: { in: followingIds } }, data: { nbFollowers: { decrement: 1 } } });
    await prisma.user.updateMany({ where: { id: { in: followedIds } }, data: { nbFollowing: { decrement: 1 } } });
    
    // delete user and its follows
    // TODO : Should email user to delete it instead (with an email button associated with a delete token)
    await prisma.user.delete({ where: { id } });
    await prisma.follow.deleteMany({ where: { OR: [{ followerId: id }, { followedId: id }] } });
}

export async function getUser(tokenId: number, userId: number) {
    const shouldBePrivate = tokenId === userId;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: shouldBePrivate? User.privateIncludes : User.publicIncludes
    });

    if (user === null)
        throw User.MESSAGES.NOT_FOUND().buildHTTPError();

    const followed = await prisma.follow.findFirst({ where: { followerId: tokenId, followedId: userId } }) != null;
    const following = await prisma.follow.findFirst({ where: { followerId: userId, followedId: tokenId } }) != null;
    return { ...User.makePrivate(user), followed, following };
}

export async function getPolls(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user === null)
        throw User.MESSAGES.NOT_FOUND().buildHTTPError();

    const polls = await prisma.poll.findMany({ where: { authorId: userId }, include: Poll.publicIncludes, orderBy: { createdAt: 'desc' } });
    return polls.map(p => Poll.makePublic(p));
}

export async function follow(followerId: number, followedId: number) {
    const exists = await prisma.follow.findFirst({ where: { followerId, followedId } });
    if (exists !== null) return;
    
    // if not exists, create follow
    await prisma.follow.create({ data: { followerId, followedId } });

    // now, update follower and followed counters
    const nbFollowers = await prisma.follow.count({ where: { followedId } });
    const nbFollowing = await prisma.follow.count({ where: { followerId } });
    await prisma.user.update({ where: { id: followerId }, data: { nbFollowing } });
    await prisma.user.update({ where: { id: followedId }, data: { nbFollowers } });

    // trigger bigdata event
    await bigData.onAccountFollowed(followerId, followedId);
}

export async function unfollow(followerId: number, followedId: number) {
    const exists = await prisma.follow.findFirst({ where: { followerId, followedId } });
    if (exists === null) return;

    // if exists, delete follow
    await prisma.follow.delete({ where: { followerId_followedId: { followerId, followedId } } });

    // now, update follower and followed counters
    const nbFollowers = await prisma.follow.count({ where: { followedId } });
    const nbFollowing = await prisma.follow.count({ where: { followerId } });
    await prisma.user.update({ where: { id: followerId }, data: { nbFollowing } });
    await prisma.user.update({ where: { id: followedId }, data: { nbFollowers } });
}

export async function getFollowers(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user === null)
        throw User.MESSAGES.NOT_FOUND().buildHTTPError();

    const followers = await prisma.follow.findMany({ where: { followedId: userId }, include: { follower: true } });
    return followers.map(f => User.makePublic(f.follower));
}

export async function getFollowing(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user === null)
        throw User.MESSAGES.NOT_FOUND().buildHTTPError();

    const following = await prisma.follow.findMany({ where: { followerId: userId }, include: { followed: true } });
    return following.map(f => User.makePublic(f.followed));
}
