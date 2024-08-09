import { Prisma } from "@prisma/client";
import Lang from "tools/Lang.ts";
import { buildResourceMessages, type ResponseMessageBuilder } from "tools/Model.ts";
import { PublicUser, User } from "./User.ts";
import { Tag } from "./Tag.ts";
import { Media } from "./Media.ts";
import { Answer } from "./Answer.ts";
import { ResponseMessage } from "tools/Responses.ts";

export interface PrivatePoll {
    id: number;
    title: string;
    description: string,
    type: string,
    authorId: string;
    author: PublicUser|undefined;
    answerIds: number[];
    answers: {emoji:string, label:string}[];
    tagIds: number[];
    tags: Tag[]|undefined;
    mediaIds: number[];
    medias: string[]|undefined;
}

export interface PublicPoll {
    id: number;
    title: string;
    description: string,
    type: string,
    authorId: string;
    author: PublicUser|undefined;
    answerIds: number[];
    answers: {emoji:string, label:string}[];
    tagIds: number[];
    tags: Tag[]|undefined;
    mediaIds: number[];
    medias: string[]|undefined;
}

const PollTranslated = Lang.GetText(Lang.CreateTranslationContext('models', 'Poll'));
export class Poll {
    public static privateIncludes: Prisma.PollInclude = {
        medias: true,
        answers: true,
        tags: {include: {tag: true}},
        author: true
    };
    public static publicIncludes: Prisma.PollInclude = {
        medias: true,
        answers: true,
        tags: {include: {tag: true}},
        author: true
    };

    public static MESSAGES: Record<string, ResponseMessageBuilder> = {
        ...buildResourceMessages(PollTranslated),
        REPORTED: () => new ResponseMessage(
            PollTranslated + ' ' + Lang.GetText(Lang.CreateTranslationContext('responses', 'Reported')),
            200
        ),
        ANSWERED: () => new ResponseMessage(
            PollTranslated + ' ' + Lang.GetText(Lang.CreateTranslationContext('responses', 'Answered')),
            200
        ),
        UNANSWERED: () => new ResponseMessage(
            PollTranslated + ' ' + Lang.GetText(Lang.CreateTranslationContext('responses', 'Unanswered')),
            200
        ),
    };

    public static makePublic(obj: any): PublicPoll {
        if (!obj) return obj;

        return {
            id: obj.id,
            title: obj.title,
            description: obj.description,
            type: obj.type,
            authorId: obj.authorId,
            answers: obj.answers ? obj.answers.map((answer: any) => Answer.makePublic(answer)) : undefined,
            answerIds: obj.answers ? obj.answers.map((answer: any) => answer?.id) : undefined,
            author: obj.author ? User.makePublic(obj.author) : undefined,
            tagIds: obj.tags ? obj.tags.map((pollTag: any) => pollTag?.tagId) : undefined,
            tags: obj.tags ? obj.tags.map((pollTag: any) => Tag.makePublic(pollTag?.tag)) : undefined,
            mediaIds: obj.medias ? obj.medias.map((media: any) => media?.id ?? media) : undefined,
            medias: obj.medias ? obj.medias.map((media: any) => Media.makePublic(media)) : undefined
        }
    }

    public static makePrivate(obj: any): PrivatePoll {
        if (!obj) return obj;

        return {
            id: obj.id,
            title: obj.title,
            description: obj.description,
            type: obj.type,
            authorId: obj.authorId,
            answers: obj.answers ? obj.answers.map((answer: any) => Answer.makePublic(answer)) : undefined,
            answerIds: obj.answers ? obj.answers.map((answer: any) => answer?.id) : undefined,
            author: obj.author ? User.makePublic(obj.author) : undefined,
            tagIds: obj.tags ? obj.tags.map((pollTag: any) => pollTag?.tagId) : undefined,
            tags: obj.tags ? obj.tags.map((pollTag: any) => Tag.makePublic(pollTag?.tag)) : undefined,
            mediaIds: obj.medias ? obj.medias.map((media: any) => media?.id ?? media) : undefined,
            medias: obj.medias ? obj.medias.map((media: any) => Media.makePublic(media)) : undefined
        }
    }
}
