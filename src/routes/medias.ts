import express from 'express';
import { respondError, respond } from 'tools/Responses.ts';
import * as controller from '../controllers/medias.ts';
import Joi from 'joi';
import { Media } from 'models/Media.ts';
import Lang from 'tools/Lang.ts';
import { ValidateMessages } from 'index.ts';
const router = express.Router();

// Get a media infos
router.get('/:id', async (req, res) => {
    /**
     * #swagger.tags = ['Medias']
     * #swagger.description = 'Get a media by ID'
     * #swagger.operationId = 'getMedia'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const { id } = req.params;

    try {
        const media = await controller.get(parseInt(id));
        respond(res, Media.MESSAGES.FETCHED(), media);
    } catch (err) { respondError(res, err); }
});

// Get a media preview file
router.get('/:id/preview', async (req, res) => {
    /**
     * #swagger.tags = ['Medias']
     * #swagger.description = 'Get a media preview file by ID'
     * #swagger.operationId = 'getMediaPreview'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const { id } = req.params;

    try {
        res.sendFile(await controller.getPreviewFilepath(parseInt(id)));
    } catch (err) { respondError(res, err); }
});

// Get a media view file
router.get('/:id/view', async (req, res) => {
    /**
     * #swagger.tags = ['Medias']
     * #swagger.description = 'Get a media view file by ID'
     * #swagger.operationId = 'getMediaView'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);

    const { id } = req.params;

    try {
        res.sendFile(await controller.getViewFilepath(parseInt(id)));
    } catch (err) { respondError(res, err); }
});

export default router;
