import { Poll } from 'models/Poll.ts';
import { prisma } from '../index.ts';
import * as fs from 'fs';
import * as tagsController from './tags.ts';
import HTTPError from 'errors/HTTPError.ts';
import { Media } from 'models/Media.ts';

function verifyOrMakePath(filepath: string) {
    const folder = filepath.substring(0, filepath.lastIndexOf('/'));
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
}

export async function getRecommendedPoll(userId: number) {
    // TODO : recommendation system
    // for the moment, returns a random poll in db

    ()=>{userId}; // just to avoid warning

    const polls = await prisma.poll.findMany({ include: Poll.publicIncludes });
    if (!polls) {
        throw Poll.MESSAGES.NOT_FOUND().buildHTTPError();
    }
    return Poll.makePublic(polls[Math.floor(Math.random() * polls.length)]);
}

export async function get(pollId: number) {
    const poll = await prisma.poll.findFirst({ where: { id: pollId }, include: Poll.publicIncludes });
    if (!poll) {
        throw Poll.MESSAGES.NOT_FOUND().buildHTTPError();
    }
    return Poll.makePublic(poll);
}

export async function createPoll(userId: number, title: string, description: string, type: string, answers: { emoji: string, label: string }[], tags: string[]) {
    const poll = await prisma.poll.create({
        data: {
            title,
            description,
            type,
            authorId: userId,
            answers: { createMany: { data: answers.map(a => ({ emoji: a.emoji, label: a.label })) } }
        }
    });
    if (!poll)
        throw HTTPError.InternalServerError();

    for (const tagName of tags) {
        const tag = await tagsController.createOrGet(tagName);
        await prisma.pollTag.create({
            data: {
                tag: { connect: { id: tag.id } },
                poll: { connect: { id: poll.id } }
            }
        });
    }

    // refetch poll to get tags
    return Poll.makePublic(await prisma.poll.findFirst({ where: { id: poll.id }, include: Poll.publicIncludes }));
}

export async function uploadMedia(userId: number, pollId: number, stream: NodeJS.ReadableStream, filename: string) {
    return new Promise((resolve, reject) => {
        const fn = async () => {
            const poll = await prisma.poll.findFirst({ where: { id: pollId }, include: { medias: true } });
            if (!poll) {
                throw Poll.MESSAGES.NOT_FOUND().buildHTTPError();
            }
            if (poll.authorId !== userId) {
                throw HTTPError.Unauthorized();
            }

            if (poll.medias.length >= 4) // too much medias
                throw HTTPError.Unauthorized();

            const media = await prisma.media.create({
                data: {
                    poll: { connect: { id: pollId } },
                    filename
                }
            });

            const publicMedia = Media.makePublic(media);
            try {
                const filepath = Media.getViewFilepath(publicMedia);
                verifyOrMakePath(filepath); // ensure folder exists
                stream.pipe(fs.createWriteStream(filepath));
                stream.on('end', () => resolve(publicMedia));
            } catch (err) {
                await prisma.media.delete({ where: { id: media.id } });
                throw err;
            }
        };
        fn().catch(reject);
    });
}

export async function deletePoll(userId: number, pollId: number) {
    const poll = await prisma.poll.findFirst({ where: { id: pollId } });
    if (!poll) {
        throw Poll.MESSAGES.NOT_FOUND().buildHTTPError();
    }
    if (poll.authorId !== userId) {
        throw HTTPError.Unauthorized();
    }
    await prisma.poll.delete({ where: { id: pollId } });

    if (fs.existsSync(Media.getPollFolder(pollId))) {
        fs.rmdirSync(Media.getPollFolder(pollId), { recursive: true });
    }
}
