import { Prisma } from "@prisma/client";
import Lang from "tools/Lang.ts";
import { buildResourceMessages, type ResponseMessageBuilder } from "tools/Model.ts";

export interface PublicTag {
    id: number;
    name: string;
}

export class Tag {
    public static publicIncludes: Prisma.TagInclude = {
        // nothing
    };

    public static MESSAGES: Record<string, ResponseMessageBuilder> = {
        ...buildResourceMessages(Lang.GetText(
            Lang.CreateTranslationContext('models', 'Tag')
        ))
    };

    public static makePublic(obj: any): PublicTag {
        if (!obj) return obj;

        return {
            id: obj.id,
            name: obj.name
        }
    }
}
