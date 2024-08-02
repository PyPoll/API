import { type Request, type Response, type NextFunction } from 'express';
import HTTPError from 'errors/HTTPError.ts';
import { TokenUtils } from 'tools/Token.ts';
import { respondError } from 'tools/Responses.ts';

/**
 * Authentication middleware, authenticates the request's resource (user, app, ...)
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @param {NextFunction} next The next function
 */
export async function auth(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.debug("Rejecting logged request : no auth header")
            throw HTTPError.Unauthorized();
        }
    
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer') {
            console.debug("Rejecting logged request : wrong auth type")
            throw HTTPError.Unauthorized();
        }

        const data = await TokenUtils.decode(token);
        if (!data) {
            console.debug("Rejecting logged request : invalid token")
            throw HTTPError.Unauthorized();
        }
        res.locals.token = data;

        next();
    } catch (err) {
        respondError(res, err);
        return;
    }
}

export async function mayAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
        next();
        return;
    }
    await auth(req, res, next);
}
