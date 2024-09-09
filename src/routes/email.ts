import express from 'express';
import * as controller from '../controllers/users.ts';
import { respondError, respond, ResponseMessage } from 'tools/Responses.ts';
import Joi from 'joi';
import { User } from 'models/User.ts';
import Lang from 'tools/Lang.ts';
import HTTP from 'tools/HTTP.ts';
import { createLoginPollingToken } from 'controllers/auth.ts';
import { ValidateMessages } from 'index.ts';
const router = express.Router();

router.get('/login', async (req, res) => {
    /**
     * #swagger.tags = ['Email']
     * #swagger.description = 'Send a login email to the user'
     * #swagger.operationId = 'emailSend'
     */
    const schema = Joi.object({
        email: Joi.string().email().required()
    });
    const { error } = schema.validate(req.query, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const { email } = req.query;

    try {
        await controller.sendEmailLogin(email as string);
        respond(res, new ResponseMessage(
            Lang.GetText(Lang.CreateTranslationContext('responses', "EmailSent")),
            HTTP.OK
        ), await createLoginPollingToken(email as string));
    } catch (err) {
        respondError(res, err);
        return;
    }
});

router.post('/login', async (req, res) => {
    /**
     * #swagger.tags = ['Email']
     * #swagger.description = 'Login using an email login token'
     * #swagger.operationId = 'emailLogin'
     */
    const schema = Joi.object({
        token: Joi.string().required()
    });
    const { error } = schema.validate(req.body, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const { token } = req.body;

    try {
        const userToken = await controller.emailLogin(token);
        respond(res, User.MESSAGES.LOGGED_IN(), userToken);
    } catch (err) {
        respondError(res, err);
        return;
    }
});

router.post('/change', async (req, res) => {
    /**
     * #swagger.tags = ['Email']
     * #swagger.description = 'Change email adress using email change token'
     * #swagger.operationId = 'emailChange'
     */
    const schema = Joi.object({
        token: Joi.string().required()
    });
    const { error } = schema.validate(req.body, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const { token } = req.body;

    try {
        const userToken = await controller.emailChange(token);
        respond(res, new ResponseMessage(
            Lang.GetText(Lang.CreateTranslationContext('responses', "EmailChanged")),
            HTTP.OK
        ), userToken);
    } catch (err) {
        respondError(res, err);
        return;
    }
});

export default router;
