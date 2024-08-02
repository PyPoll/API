import { type Request, type Response, type NextFunction } from 'express';
import Lang from 'tools/Lang.ts';

/**
 * Resources translation middleware, sets the language of the response
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @param {NextFunction} next The next function
 */
export default function (req: Request, res: Response, next: NextFunction) {
    const lang = req.headers['accept-language'] || 'en';
    Lang.setLanguage(lang);
    next();
}
