import { type Request, type Response, type NextFunction } from 'express';

/**
 * A map of IP addresses to timestamps
 * @typedef {Object} RequestsMapInterface
 * @property {number[]} [key] The IP address of the client
 * @property {number[]} [value] An array of timestamps
 */
interface RequestsMapInterface {
    [key: string]: number[];
}

/**
 * Creates a middleware function that limits the number of requests to specified parameters
 * @param period The period in seconds (default = 1)
 * @param max The maximum number of requests in the period (default = 1)
 * @returns A middleware function that limits the number of requests to (max) requests in (period) seconds
 */
export default function (period: number, max: number) {
    const requestsMap: RequestsMapInterface = {};
    
    /**
     * Request limiter middleware, limits the number of requests to x requests in y seconds
     * @param {Request} req The request object
     * @param {Response} res The response object
     * @param {NextFunction} next The next function
     */
    return function (req: Request, res: Response, next: NextFunction) {
        const requestIP = req.headers['X-Forwarded-Host']?.toString() ?? '';
        console.log('CalmDown data : RequestIP from header = ' + requestIP + ' | RequestIP from connection = ' + req.ip);
        if (!requestIP) {
            console.log('CalmDown error : Cannot block from unknown IP');
            next();
            return;
        }

        const requests = requestsMap[requestIP] || [];
        const now = Date.now();
        const period_ms = period * 1000;
        const period_start = now - period_ms;
        const period_requests = requests.filter((timestamp) => timestamp > period_start);

        if (period_requests.length > max) {
            console.log('Blocking request from', requestIP);
            return res.status(429).send('Too many requests');
        }

        requestsMap[requestIP] = [...period_requests, now].filter((timestamp) => timestamp > period_start);
        next();
    }
}
