import express from 'express';
import { respondError, respond, ResponseMessage } from 'tools/Responses.ts';
import * as controller from '../controllers/bigData.ts';
import Joi from 'joi';
import { prisma, ValidateMessages } from 'index.ts';
import { Poll } from 'models/Poll.ts';
import HTTP from 'tools/HTTP.ts';
import Lang from 'tools/Lang.ts';
const router = express.Router();

// When account is looked by a user
router.post('/lookAccount', async (req, res) => {
    /**
     * #swagger.tags = ['Stats']
     * #swagger.description = 'When account is looked by a user'
     * #swagger.operationId = 'lookAccount'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        pollId: Joi.number().required()
    });
    const { error } = schema.validate(req.body, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const userId = res.locals.token.id;
    const { pollId } = req.body;

    try {
        const poll = await prisma.poll.findUnique({ where: { id: pollId } })
        if (!poll) {
            respondError(res, Poll.MESSAGES.NOT_FOUND().buildHTTPError());
            return;
        }

        await controller.onAccountLooked(parseInt(userId), poll.id, poll.authorId);
        respond(res, new ResponseMessage("OK", HTTP.OK));
    } catch (err) { respondError(res, err); }
});

// When poll is skipped by a user
router.post('/skipPoll', async (req, res) => {
    /**
     * #swagger.tags = ['Stats']
     * #swagger.description = 'When poll is skipped by a user'
     * #swagger.operationId = 'skipPoll'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        pollId: Joi.number().required()
    });
    const { error } = schema.validate(req.body, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const userId = res.locals.token.id;
    const { pollId } = req.body;

    try {
        const poll = await prisma.poll.findUnique({ where: { id: pollId } })
        if (!poll) {
            respondError(res, Poll.MESSAGES.NOT_FOUND().buildHTTPError());
            return;
        }

        await controller.onPollSkipped(parseInt(userId), poll.id, poll.authorId);
        respond(res, new ResponseMessage("OK", HTTP.OK));
    } catch (err) { respondError(res, err); }
});

export default router;
