import { Prisma } from "@prisma/client";
import Lang from "tools/Lang.ts";
import { buildResourceMessages, type ResponseMessageBuilder } from "tools/Model.ts";
import { ResponseMessage } from "tools/Responses.ts";

export interface PrivateUser {
    id: number;
    pseudo: string;
    email: string;
    bio: string;
    nbFollowers: number;
    nbFollowing: number;
    furwazId: number;
}

export interface PublicUser {
    id: number;
    pseudo: string;
    bio: string;
    nbFollowers: number;
    nbFollowing: number;
}

export class User {
    public static privateIncludes: Prisma.UserInclude = {
        // nothing
    };
    public static publicIncludes: Prisma.UserInclude = {
        // nothing
    };

    public static MESSAGES: Record<string, ResponseMessageBuilder> = {
        ...buildResourceMessages(Lang.GetText(
            Lang.CreateTranslationContext('models', 'User')
        )),
        LOGGED_IN: () => new ResponseMessage(
            Lang.GetText(Lang.CreateTranslationContext('responses', 'LoggedIn')),
            200
        ),
        TOKEN_REFRESHED: () => new ResponseMessage(
            Lang.GetText(Lang.CreateTranslationContext('responses', 'TokenRefreshed')),
            200
        ),
        FOLLOWED: () => new ResponseMessage(
            Lang.GetText(Lang.CreateTranslationContext('responses', 'Followed')),
            200
        ),
        UNFOLLOWED: () => new ResponseMessage(
            Lang.GetText(Lang.CreateTranslationContext('responses', 'Unfollowed')),
            200
        ),
        CONFLICT: () => new ResponseMessage(
            Lang.GetText(Lang.CreateTranslationContext('responses', 'Conflict')),
            409
        ),
    };

    public static makePublic(obj: any): PublicUser {
        if (!obj) return obj;

        return {
            id: obj.id,
            pseudo: obj.pseudo,
            bio: obj.bio,
            nbFollowers: obj.nbFollowers,
            nbFollowing: obj.nbFollowing
        }
    }

    public static makePrivate(obj: any): PrivateUser {
        if (!obj) return obj;

        return {
            id: obj.id,
            pseudo: obj.pseudo,
            email: obj.email,
            bio: obj.bio,
            nbFollowers: obj.nbFollowers,
            nbFollowing: obj.nbFollowing,
            furwazId: obj.furwazId
        }
    }
}
