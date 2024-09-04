import { Poll } from 'models/Poll.ts';
import { prisma } from '../index.ts';
import * as fs from 'fs';
import * as tagsController from './tags.ts';
import HTTPError from 'errors/HTTPError.ts';
import { Media } from 'models/Media.ts';
import * as bigData from './bigData.ts';

function verifyOrMakePath(filepath: string) {
    const folder = filepath.substring(0, filepath.lastIndexOf('/'));
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
}

export async function getRecommendedPoll(userId: number) {
    const pollIds = await prisma.poll.findMany({
        select: { id: true },
        where: {
            authorId: { not: userId },
            votes: { none: { userId } }
        }
    });
    if (pollIds.length === 0) {
        throw Poll.MESSAGES.NOT_FOUND().buildHTTPError();
    }

    const random5Ids = pollIds.sort(() => Math.random() - 0.5).slice(0, 5).map(p => p.id);

    const winner = { score: -9999, pollId: 0 };
    for (const pollId of random5Ids) {
        const score = await bigData.getPollUserMatchScore(userId, pollId);
        if (score > winner.score) {
            winner.score = score;
            winner.pollId = pollId;
        }
    }
    const poll = await prisma.poll.findFirst({ where: { id: winner.pollId }, include: Poll.publicIncludes });
    if (!poll) {
        throw Poll.MESSAGES.NOT_FOUND().buildHTTPError();
    }

    const answered = (await prisma.pollAnswer.findMany({ where: { pollId: poll.id, userId } })).map(a => a.answerId);
    return { ...Poll.makePublic(poll), answered };
}

export async function get(userId: number, pollId: number) {
    const poll = await prisma.poll.findFirst({ where: { id: pollId }, include: Poll.publicIncludes });
    if (!poll) {
        throw Poll.MESSAGES.NOT_FOUND().buildHTTPError();
    }

    const answered = (await prisma.pollAnswer.findMany({ where: { pollId, userId } })).map(a => a.answerId);
    return { ...Poll.makePublic(poll), answered };
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

    // trigger bigdata event
    await bigData.onPollCreated(poll.id);

    // refetch poll to get tags
    const newPoll = await prisma.poll.findFirst({ where: { id: poll.id }, include: Poll.publicIncludes });
    return Poll.makePublic(newPoll);
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

export async function answerPoll(userId: number, pollId: number, answerId: number) {
    const poll = await prisma.poll.findFirst({ where: { id: pollId }, include: { answers: true } });
    if (!poll) {
        throw Poll.MESSAGES.NOT_FOUND().buildHTTPError();
    }

    const answer = poll.answers.find(a => a.id === answerId);
    if (!answer) {
        throw HTTPError.BadRequest();
    }

    if (poll.type === 'unique') {
        const oldAnswers = await prisma.pollAnswer.findMany({ where: { pollId, userId } });
        for (const oldAnswer of oldAnswers) {
            await prisma.answer.update({ where: { id: oldAnswer.answerId }, data: { nbVotes: { decrement: 1 } } });
        }
        await prisma.pollAnswer.deleteMany({ where: { pollId, userId } });
    }

    const alreadyAnswered = await prisma.pollAnswer.findFirst({ where: { pollId, userId, answerId } });
    if (!alreadyAnswered) {
        await prisma.pollAnswer.create({
            data: {
                poll: { connect: { id: pollId } },
                user: { connect: { id: userId } },
                answer: { connect: { id: answerId } }
            }
        });
        await prisma.answer.update({ where: { id: answerId }, data: { nbVotes: { increment: 1 } }});
    }

    // trigger bigdata event
    await bigData.onPollAnswered(userId, pollId);
}

export async function removeAnswerPoll(userId: number, pollId: number, answerId: number) {
    const poll = await prisma.poll.findFirst({ where: { id: pollId }, include: { answers: true } });
    if (!poll) {
        throw Poll.MESSAGES.NOT_FOUND().buildHTTPError();
    }

    const answer = poll.answers.find(a => a.id === answerId);
    if (!answer) {
        throw HTTPError.BadRequest();
    }

    const alreadyAnswered = await prisma.pollAnswer.findFirst({ where: { pollId, userId, answerId } });
    if (!alreadyAnswered) {
        return;
    }
    await prisma.pollAnswer.deleteMany({ where: { pollId, userId, answerId } });
    await prisma.answer.update({ where: { id: answerId }, data: { nbVotes: { decrement: 1 } }});
}

export async function getAnswers(userId: number, pollId: number) {
    const poll = await prisma.poll.findFirst({ where: { id: pollId }, include: { answers: true } });
    if (!poll) {
        throw Poll.MESSAGES.NOT_FOUND().buildHTTPError();
    }

    return poll.answers.map(a => ({ id: a.id, count: a.nbVotes }));
}

export async function reportPoll(userId: number, pollId: number, reason: string) {
    const poll = await prisma.poll.findFirst({ where: { id: pollId } });
    if (!poll) {
        throw Poll.MESSAGES.NOT_FOUND().buildHTTPError();
    }
    
    const alreadyReported = await prisma.pollReports.findFirst({ where: { pollId, userId } });
    if (alreadyReported) return;

    await prisma.pollReports.create({
        data: {
            reason,
            poll: { connect: { id: pollId } },
            user: { connect: { id: userId } }
        }
    });
}

export async function getReportScore(userId: number, pollId: number) {
    // TODO : Should use userId to check privileges

    const USER_TRUST_WEIGHT = 0.5; // (one user with trust level 2 = 1 score)

    const reports = await prisma.pollReports.findMany({ where: { pollId }, include: { user: true } });

    let reportScore = 0;
    for (const report of reports) {
        const userTrustLevel = report.user.reportScore ?? 0;
        reportScore += 1; // base score
        reportScore += userTrustLevel * USER_TRUST_WEIGHT; // user trust
    }

    return reportScore;
}
