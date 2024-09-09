import { prisma } from "index.ts";

const POLL_ANSWERED_SCORE_FACTOR = 1 / 4;
const POLL_SKIPPED_SCORE_FACTOR = -1 / 8;
const ACCOUNT_LOOKED_SCORE_FACTOR = 1 / 8;
const ACCOUNT_FOLLOWED_SCORE_FACTOR = 1 / 4;
const POLL_ALREADY_VIEWED_MANUS = 10;

type TagScoreList = {[tagId: number]: number};

/**
 * Normalize the scores of a list of tags
 * @param tags The list of tags
 * @returns The normalized list of tags
 */
function softmax(tags: TagScoreList): TagScoreList {
    let sum = 0;
    for (const tagId in tags) {
        sum += tags[tagId];
    }
    const result: TagScoreList = {};
    for (const tagId in tags) {
        result[tagId] = tags[tagId] / sum;
    }
    return result;
}

/**
 * Intersect two lists of tags and return the sum of the products of the scores
 * @param a First list of tags
 * @param b Second list of tags
 * @returns The intersection score of the two lists
 */
function intersectTags(a: TagScoreList, b: TagScoreList): number {
    let sum = 0;
    for (const tagId in a) {
        if (b[tagId]) {
            sum += a[tagId] * b[tagId];
        }
    }
    return sum;
}

/**
 * Add two lists of tags element-wise.
 * If a tag isn't present in the a list, its value is initialized to the b list value.
 * If a tag isn't present in the b list, its value isn't changed in the a list.
 * Else, the value is the sum of the two values.
 * @param a First list of tags
 * @param b Second list of tags
 * @returns The sum of the two lists
 */
function addElementWise(a: TagScoreList, b: TagScoreList): TagScoreList {
    const result: TagScoreList = {};
    for (const tagId in a) {
        result[tagId] = a[tagId];
    }
    for (const tagId in b) {
        if (result[tagId]) {
            result[tagId] += b[tagId];
        } else {
            result[tagId] = b[tagId];
        }
    }
    return result;
}

/**
 * Multiply the scores of a list of tags by a factor
 * @param list List of tags
 * @param factor Factor to multiply the scores by
 * @returns The list of tags with the scores multiplied by the factor
 */
function applyElementWise(list: TagScoreList, factor: number): TagScoreList {
    const result: TagScoreList = {};
    for (const tagId in list) {
        result[tagId] = list[tagId] * factor;
    }
    return result;
}

// TODO : Add cache for this function
async function getUserTagsScores(userId: number): Promise<TagScoreList> {
    const dbTags = (await prisma.user.findUnique({
        where: { id: userId }
    }))?.tagsScores;
    const tags: TagScoreList = JSON.parse(dbTags ?? "{}");
    return tags;
}

// TODO : Add cache for this function
async function setUserTagsScores(userId: number, tags: TagScoreList) {
    await prisma.user.update({
        where: { id: userId },
        data: { tagsScores: JSON.stringify(tags) }
    });
}

// TODO : Add cache for this function
async function getPollTagsScores(pollId: number): Promise<TagScoreList> {
    const dbTags = await prisma.tag.findMany({
        where: { polls: { some: { pollId } } }
    });
    const tags: TagScoreList = {};
    for (const tag of dbTags) {
        tags[tag.id] = tag.score;
    }
    return tags;
}

export async function onPollAnswered(userId: number, pollId: number) {
    await setUserTagsScores(
        userId,
        addElementWise(
            await getUserTagsScores(userId),
            applyElementWise(
                await getPollTagsScores(pollId),
                POLL_ANSWERED_SCORE_FACTOR
            )
        )
    );
}

export async function onPollCreated(pollId: number) {
    const pollTags = await prisma.pollTag.findMany({ where: { pollId } });
    for (const pollTag of pollTags) {
        await prisma.tag.update({
            where: { id: pollTag.tagId },
            data: { score: { increment: 1 } }
        });
    }
}

export async function onPollSkipped(userId: number, pollId: number, accountId: number) {
    if (accountId === userId) return;
    await setUserTagsScores(
        userId,
        addElementWise(
            await getUserTagsScores(userId),
            applyElementWise(
                addElementWise(
                    await getUserTagsScores(accountId),
                    await getPollTagsScores(pollId)
                ),
                POLL_SKIPPED_SCORE_FACTOR
            )
        )
    );
}

export async function onAccountLooked(userId: number, pollId: number, accountId: number) {
    if (accountId === userId) return;
    await setUserTagsScores(
        userId,
        addElementWise(
            await getUserTagsScores(userId),
            applyElementWise(
                await getUserTagsScores(accountId),
                ACCOUNT_LOOKED_SCORE_FACTOR
            )
        )
    )
}

export async function onAccountFollowed(userId: number, accountId: number) {
    if (accountId === userId) return;
    await setUserTagsScores(
        userId,
        addElementWise(
            await getUserTagsScores(userId),
            applyElementWise(
                await getUserTagsScores(accountId),
                ACCOUNT_FOLLOWED_SCORE_FACTOR
            )
        )
    )
}

export async function getPollUserMatchScore(userId: number, pollId: number) {
    const userTags = await getUserTagsScores(userId);
    const pollTags = await getPollTagsScores(pollId);
    const nbPollViews = (await prisma.pollViews.findFirst({ where: { pollId, userId }}))?.nbViews ?? 0;
    return intersectTags(softmax(userTags), softmax(pollTags)) - (nbPollViews * POLL_ALREADY_VIEWED_MANUS);
}
