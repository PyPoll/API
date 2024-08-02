import { type Request, type Response, type NextFunction } from 'express';

/**
 * Resources translation middleware, sets the language of the response
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @param {NextFunction} next The next function
 */
export default (route:RegExp, middleware: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.path.match(route)) return next();
        middleware(req, res, next);
    }
}
