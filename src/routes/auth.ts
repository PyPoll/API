import { respondError, respond } from 'tools/Responses.ts';
import * as controller from '../controllers/auth.ts';
import { User } from 'models/User.ts';
const router = express.Router();
import express from 'express';
import { auth } from 'middleware/auth.ts';
import HTTPError from 'errors/HTTPError.ts';
import { TokenUtils } from 'tools/Token.ts';
import { generateToken, getUserInfos, removeUserInfos } from 'tools/Portal.ts';
import { Token } from 'models/Token.ts';
import { Portal } from 'models/Portal.ts';
import Joi from 'joi';
import { ValidateMessages } from 'index.ts';
import Lang from 'tools/Lang.ts';

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
     * #swagger.description = 'Retreive a user token from its login token (long polling)'
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

router.post('/furwaz/generate', async (req, res) => {
    /**
     * #swagger.tags = ['Authentication']
     * #swagger.description = 'Generated a FurWaz Portal token to log in'
     * #swagger.operationId = 'GenerateFurWazPortalToken'
     */
    try {
        const token = await generateToken();
        respond(res, Portal.MESSAGES.CREATED(), token);
    } catch (err) { respondError(res, err); }
});

router.get('/furwaz/token', async (req, res) => {
    /**
     * #swagger.tags = ['Authentication']
     * #swagger.description = 'Refresh a user access token with its refresh token'
     * #swagger.operationId = 'refreshFurWazToken'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    try {
        const portalToken = req.query.token as string;
        const authHeader = req.headers.authorization;
        if (!portalToken && !authHeader) throw HTTPError.BadRequest();

        if (portalToken) {
            const forcedPseudo = req.query.pseudo as string;
            const forcedEmail = req.query.email as string;

            const portalUserInfos = await getUserInfos(portalToken, false);
            const userInfos = await controller.createOrLoginFurWazUser(portalUserInfos.id, forcedPseudo, forcedEmail);

            if (userInfos.conflict) {
                return respond(res, User.MESSAGES.CONFLICT(), userInfos.conflict);
            }
            removeUserInfos(portalToken);
            const token = await controller.createUserToken(userInfos.user.id);
            return respond(res, Token.MESSAGES.CREATED(), {token, ... userInfos});
        }

        if (!authHeader) throw HTTPError.Unauthorized();
    
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer') throw HTTPError.Unauthorized();
    
        const data = await TokenUtils.decode(token);
        const newToken = await controller.createUserToken(data.id);
        respond(res, Token.MESSAGES.CREATED(), newToken);
    } catch (err) { respondError(res, err); }
});

router.post('/link/furwaz', auth, async (req, res) => {
    /**
     * #swagger.tags = ['Authentication']
     * #swagger.description = 'Link a FurWaz account to the current user'
     * #swagger.operationId = 'linkFurWazAccount'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    try {
        const schema = Joi.object({
            token: Joi.string().required()
        });
        const { error } = schema.validate(req.body, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
        if (error) return respondError(res, error);

        const { token } = req.body;

        const user = await controller.linkFurWazAccount(res.locals.token.id, token);
        respond(res, User.MESSAGES.UPDATED(), User.makePrivate(user));
    } catch (err) { respondError(res, err); }
});

router.delete('/link/furwaz', auth, async (req, res) => {
    /**
     * #swagger.tags = ['Authentication']
     * #swagger.description = 'Unlink a FurWaz account from the current user'
     * #swagger.operationId = 'unlinkFurWazAccount'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    try {const user = await controller.unlinkFurWazAccount(res.locals.token.id);
        respond(res, User.MESSAGES.UPDATED(), User.makePrivate(user));
    } catch (err) { respondError(res, err); }
});

export default router;
