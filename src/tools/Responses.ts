import HTTPError from 'errors/HTTPError.ts';
import type { Response } from 'express';
import Lang from './Lang.ts';
import Joi from 'joi';

export class ResponseMessage {
    message: string;
    status: number;

    constructor(message: string, status: number = 200) {
        this.message = message;
        this.status = status;
    }

    buildHTTPError() {
        return new HTTPError(this.status, this.message);
    }
}

/**
 * Responds to the client with an error and logs it to the console if it's not an HTTPError
 * @param res The response object to send the error to
 * @param err The error to handle and send / log to the client / console
 */
export function respondError(res: Response, err: Error|unknown) {
    if (err instanceof HTTPError) {
        res.status(err.status).json({ error: err.message });
    } else if (err instanceof Joi.ValidationError) {
        res.status(400).json({ error: err.message, field: err.details[0].path[0] });
    } else {
        console.error(err);
        const tradContext = Lang.CreateTranslationContext('errors', 'InternalServerError');
        res.status(500).json({ error: Lang.GetText(tradContext) });
    }
}

/**
 * Responds to the client with a message and data (if any)
 * @param res The response object to send the response to
 * @param message The response message (status and text)
 * @param data (optional) The data to send to the client
 */
export function respond(res: Response, message: ResponseMessage, data: unknown = undefined) {
    res.status(message.status).json({ data, message: message.message });
}
