import { respondError, respond } from 'tools/Responses.ts';
import * as controller from '../controllers/auth.ts';
import { User } from 'models/User.ts';
const router = express.Router();
import express from 'express';
import { auth } from 'middleware/auth.ts';
import HTTPError from 'errors/HTTPError.ts';
import { TokenUtils } from 'tools/Token.ts';

router.get('/token', auth, async (req, res) => {
    /**
     * #swagger.tags = ['Authentication']
     * #swagger.description = 'Recreate a user token with its old (still valid) one'
     * #swagger.operationId = 'refreshToken'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    try {
        const { token } = res.locals;
        const newToken = await controller.createUserToken(token.id);
        respond(res, User.MESSAGES.TOKEN_REFRESHED(), newToken);
    } catch (err) { respondError(res, err); }
});

router.get('/login', async (req, res) => {
    /**
     * #swagger.tags = ['Authentication']
     * #swagger.description = 'Retreive a user token from it\'s login token (long polling)'
     * #swagger.operationId = 'login'
     */
    try {
        const { token } = req.query;
        if (!token || !(typeof(token) === 'string')) throw HTTPError.Forbidden();

        const decoded = await TokenUtils.decode(token);
        if (!controller.checkLoginPollingToken(decoded))
            throw HTTPError.Forbidden();

        const email = decoded.payload.email as string;
        controller.addEmailPollingRequest(email, res);
    } catch (err) { respondError(res, err); }
});

export default router;
