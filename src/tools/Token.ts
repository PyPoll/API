import jwt from "jsonwebtoken";
import Config from "./Config.ts";
import HTTPError from "errors/HTTPError.ts";

export interface TokenData {
    id: number;
    payload?: any;
    expiration?: string;
}

export class TokenUtils {
    private static isValidData(data: TokenData): boolean {
        return typeof(data.id) === 'number';
    }

    private static getExpiration(exp: string|undefined): string|number|undefined {
        if (exp === undefined || exp.trim() === '') return undefined;
        const nbr = parseInt(exp.match(/^\d+$/)?.[0] ?? '');
        if (isNaN(nbr)) return exp;
        return nbr;
    }

    static async encode(data: TokenData): Promise<string> {
        const payload: any = { id: data.id };
        if (data.payload) payload.payload = data.payload;
        return await this.encodePayload(payload, data.expiration);
    }

    static async decode(token: string): Promise<TokenData> {
        const data = await this.decodePayload(token) as TokenData;
        if (!this.isValidData(data))
            throw HTTPError.Unauthorized();
        return data;
    }

    static async encodePayload(payload: object, expiration?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const exp = this.getExpiration(expiration);
            jwt.sign(
                payload,
                Config.security.jwtSecret,
                exp ? { expiresIn: exp } : {},
                (err, token) => {
                if (err) reject(err);
                else if (!token?.trim()) reject('Empty token');
                else resolve(token ?? '');
            });
        });
    }

    static async decodePayload(token: string): Promise<object> {
        return new Promise((resolve, reject) => {
            jwt.verify(token, Config.security.jwtSecret, (err, decoded) => {
                if (err) reject(HTTPError.InvalidToken());
                else if (!decoded) reject(HTTPError.Unauthorized());
                else resolve(decoded as object);
            });
        });
    }
}
