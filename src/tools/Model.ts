import HTTP from "./HTTP.ts";
import Lang from "./Lang.ts";
import { ResponseMessage } from "./Responses.ts";

export type ResponseMessageBuilder = () => ResponseMessage;

export function buildResourceMessages(resource: string) {
    return {
        CREATED:   buildCreateMessage(resource),
        UPDATED:   buildUpdateMessage(resource),
        DELETED:   buildDeleteMessage(resource),
        FETCHED:   buildFetchMessage(resource),
        NOT_FOUND: buildNotFoundMessage(resource),
        ADDED:     buildMessage(resource, 'Added', HTTP.OK),
        REMOVED:   buildMessage(resource, 'Removed', HTTP.OK)
    };
}

export function buildCreateMessage(resource: string) {
    return buildMessage(resource, 'Created', HTTP.CREATED);
}

export function buildUpdateMessage(resource: string) {
    return buildMessage(resource, 'Updated', HTTP.OK);
}

export function buildDeleteMessage(resource: string) {
    return buildMessage(resource, 'Deleted', HTTP.OK);
}

export function buildFetchMessage(resource: string) {
    return buildMessage(resource, 'Fetched', HTTP.OK);
}

export function buildNotFoundMessage(resource: string) {
    return buildMessage(resource, 'NotFound', HTTP.NOT_FOUND);
}

export function buildMessage(resource: string, action: string, code: number): ResponseMessageBuilder {
    return () => new ResponseMessage(
        Lang.GetText(Lang.CreateTranslationContext('responses', action, { resource })),
        code
    );
}
