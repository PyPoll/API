import express from 'express';
import { respondError, respond } from 'tools/Responses.ts';
import * as controller from '../controllers/polls.ts';
import { auth } from 'middleware/auth.ts';
import { Poll } from 'models/Poll.ts';
import Joi from 'joi';
import HTTPError from 'errors/HTTPError.ts';
import { Media } from 'models/Media.ts';
const router = express.Router();

// Get a new poll (from recommandation)
router.get('/', auth, async (req, res) => {
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
router.post('/', auth, async (req, res) => {
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
    const { error } = schema.validate(req.body);
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
router.get('/:id', auth, async (req, res) => {
    /**
     * #swagger.tags = ['Polls']
     * #swagger.description = 'Get a poll by ID'
     * #swagger.operationId = 'getPoll'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const { id } = req.params;

    try {
        const poll = await controller.get(parseInt(id));
        respond(res, Poll.MESSAGES.FETCHED(), poll);
    } catch (err) { respondError(res, err); }
});

// Upload a new poll media
router.post('/:id/media', auth, async (req, res) => {
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
    const { error } = schema.validate(req.params);
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

// Delete a post
router.delete('/:id', auth, async (req, res) => {
    /**
     * #swagger.tags = ['Polls']
     * #swagger.description = 'Delete a poll'
     * #swagger.operationId = 'deletePoll'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const { id } = req.params;

    try {
        await controller.deletePoll(token.id, parseInt(id));
        respond(res, Poll.MESSAGES.DELETED());
    } catch (err) { respondError(res, err); }
});

export default router;
