import { Prisma } from "@prisma/client";
import Lang from "tools/Lang.ts";
import { buildResourceMessages, type ResponseMessageBuilder } from "tools/Model.ts";

export interface PrivateAnswer {
    id: number;
    emoji: string;
    label: string;
    pollId: number;
}

export interface PublicAnswer {
    id: number;
    emoji: string;
    label: string;
}

export class Answer {
    public static privateIncludes: Prisma.AnswerInclude = {
        // nothing (fetching only own fields)
    };
    public static publicIncludes: Prisma.AnswerInclude = {
        // nothing (fetching only own fields)
    };

    public static MESSAGES: Record<string, ResponseMessageBuilder> = {
        ...buildResourceMessages(Lang.GetText(
            Lang.CreateTranslationContext('models', 'Poll')
        ))
    };

    public static makePublic(obj: any): PublicAnswer {
        if (!obj) return obj;

        return {
            id: obj.id,
            emoji: obj.emoji,
            label: obj.label
        }
    }

    public static makePrivate(obj: any): PrivateAnswer {
        if (!obj) return obj;

        return {
            id: obj.id,
            emoji: obj.emoji,
            label: obj.label,
            pollId: obj.pollId
        }
    }
}
