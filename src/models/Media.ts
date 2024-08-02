import { Prisma } from "@prisma/client";
import { getRootDir } from "index.ts";
import Lang from "tools/Lang.ts";
import { buildResourceMessages, type ResponseMessageBuilder } from "tools/Model.ts";

export interface PublicMedia {
    id: number;
    filename: string;
    previewPath: string;
    viewPath: string;
    pollId: number;
}

export class Media {
    public static publicIncludes: Prisma.MediaInclude = {
        // nothing
    };

    public static MESSAGES: Record<string, ResponseMessageBuilder> = {
        ...buildResourceMessages(Lang.GetText(
            Lang.CreateTranslationContext('models', 'Media')
        ))
    };

    public static getMediaRootFolder() {
        const rootFolder = getRootDir();
        return `${rootFolder}/media`;
    }

    public static getPollFolder(pollId: number) {
        return `${this.getMediaRootFolder()}/${pollId}`;
    }

    public static getPreviewFilepath(media: PublicMedia) {
        return `${this.getPollFolder(media.pollId)}/${media.id}.jpg`;
    }
    public static getViewFilepath(media: PublicMedia) {
        return `${this.getPollFolder(media.pollId)}/${media.filename}`;
    }

    public static makePublic(obj: any): PublicMedia {
        if (!obj) return obj;

        return {
            id: obj.id,
            filename: obj.filename,
            previewPath: obj.previewPath ?? `/medias/${obj.id}/preview`,
            viewPath: obj.viewPath ?? `/medias/${obj.id}/view`,
            pollId: obj.pollId
        }
    }
}
