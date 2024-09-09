import express from 'express';
import { respondError, respond } from 'tools/Responses.ts';
import * as controller from '../controllers/polls.ts';
import { Poll } from 'models/Poll.ts';
import Joi from 'joi';
import HTTPError from 'errors/HTTPError.ts';
import { Media } from 'models/Media.ts';
import Lang from 'tools/Lang.ts';
import { ValidateMessages } from 'index.ts';
const router = express.Router();

// Get a new poll (from recommandation)
router.get('/', async (req, res) => {
    /**
     * #swagger.tags = ['Polls']
     * #swagger.description = 'Get a new poll from recommandation'
     * #swagger.operationId = 'getNewPoll'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    try {
        const { token } = res.locals;
        const poll = await controller.getRecommendedPoll(token.id);
        respond(res, Poll.MESSAGES.FETCHED(), poll);
    } catch (err) { respondError(res, err); }
});

// Create a new poll
router.post('/', async (req, res) => {
    /**
     * #swagger.tags = ['Polls']
     * #swagger.description = 'Create a new poll'
     * #swagger.operationId = 'createPoll'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        type: Joi.string().valid('unique', 'multiple').required(),
        answers: Joi.array().items({
            emoji: Joi.string().required(),
            label: Joi.string().required()
        }).min(2).required(),
        tags: Joi.array().items(Joi.string())
    });
    const { error } = schema.validate(req.body, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const { title, description, type, answers, tags } = req.body;

    try {
        const poll = await controller.createPoll(
            token.id,
            title,
            description,
            type,
            answers,
            tags
        );
        respond(res, Poll.MESSAGES.CREATED(), poll);
    } catch (err) { respondError(res, err); }
});

// Get a poll by ID
router.get('/:id', async (req, res) => {
    /**
     * #swagger.tags = ['Polls']
     * #swagger.description = 'Get a poll by ID'
     * #swagger.operationId = 'getPoll'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const { id } = req.params;

    try {
        const poll = await controller.get(token.id, parseInt(id));
        respond(res, Poll.MESSAGES.FETCHED(), poll);
    } catch (err) { respondError(res, err); }
});

// Delete a post
router.delete('/:id', async (req, res) => {
    /**
     * #swagger.tags = ['Polls']
     * #swagger.description = 'Delete a poll'
     * #swagger.operationId = 'deletePoll'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const { id } = req.params;

    try {
        await controller.deletePoll(token.id, parseInt(id));
        respond(res, Poll.MESSAGES.DELETED());
    } catch (err) { respondError(res, err); }
});

// Upload a new poll media
router.post('/:id/media', async (req, res) => {
    /**
     * #swagger.tags = ['Polls']
     * #swagger.description = 'Upload a new poll media'
     * #swagger.operationId = 'uploadMedia'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     * #swagger.consumes = ['multipart/form-data']
     * #swagger.parameters['file'] = { in: 'formData', type: 'file', required: true }
     */
    const { token } = res.locals;
    const { id } = req.params;

    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    try {
        if (!req.busboy) {
            console.error('No busboy');
            throw HTTPError.BadRequest();
        }

        req.busboy.on('file', async (name, stream, info) => {
            const filename = info.filename;
            try {
                const media = await controller.uploadMedia(token.id, parseInt(id), stream, filename);
                respond(res, Media.MESSAGES.CREATED(), media);
            } catch (err) { respondError(res, err); }
        });
        req.pipe(req.busboy);
    } catch (err) { respondError(res, err); }
});

router.get('/:id/answers', async (req, res) => {
    /**
     * #swagger.tags = ['Polls']
     * #swagger.description = 'Get answers of a poll'
     * #swagger.operationId = 'getPollAnswers'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const { id } = req.params;

    try {
        const answers = await controller.getAnswers(token.id, parseInt(id));
        respond(res, Poll.MESSAGES.FETCHED(), answers);
    } catch (err) { respondError(res, err); }
});

router.post('/:id/answers', async (req, res) => {
    /**
     * #swagger.tags = ['Polls']
     * #swagger.description = 'Answer a poll'
     * #swagger.operationId = 'answerPoll'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required(),
        answerId: Joi.number().required()
    });
    const { error } = schema.validate({ ...req.params, ...req.body }, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const { id } = req.params;
    const { answerId } = req.body;

    try {
        await controller.answerPoll(token.id, parseInt(id), parseInt(answerId));
        respond(res, Poll.MESSAGES.ANSWERED());
    } catch (err) { respondError(res, err); }
});

router.delete('/:id/answers/:answerId', async (req, res) => {
    /**
     * #swagger.tags = ['Polls']
     * #swagger.description = 'Delete an answer of a poll'
     * #swagger.operationId = 'deletePollAnswer'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required(),
        answerId: Joi.number().required()
    });
    const { error } = schema.validate({ ...req.params }, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const { id, answerId } = req.params

    try {
        await controller.removeAnswerPoll(token.id, parseInt(id), parseInt(answerId));
        respond(res, Poll.MESSAGES.UNANSWERED());
    } catch (err) { respondError(res, err); }
});

router.get('/:id/reports', async (req, res) => {
    /**
     * #swagger.tags = ['Polls']
     * #swagger.description = 'Get report score of a poll'
     * #swagger.operationId = 'getPollReports'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const { id } = req.params;

    try {
        const score = await controller.getReportScore(token.id, parseInt(id));
        respond(res, Poll.MESSAGES.FETCHED(), score);
    } catch (err) { respondError(res, err); }
});

router.post('/:id/reports', async (req, res) => {
    /**
     * #swagger.tags = ['Polls']
     * #swagger.description = 'Report a poll'
     * #swagger.operationId = 'reportPoll'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required(),
        reason: Joi.string().required()
    });
    const { error } = schema.validate({ ...req.params, ...req.body }, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const { id } = req.params;
    const { reason } = req.body;

    try {
        await controller.reportPoll(token.id, parseInt(id), reason);
        respond(res, Poll.MESSAGES.REPORTED());
    } catch (err) { respondError(res, err); }
});

export default router;
