import express from 'express';
import { respondError, respond } from 'tools/Responses.ts';
import * as controller from '../controllers/tags.ts';
import { Tag } from 'models/Tag.ts';
import Joi from 'joi';
const router = express.Router();

router.get('/search', async (req, res) => {
    /**
     * #swagger.tags = ['Tags']
     * #swagger.description = 'Search for tags'
     * #swagger.operationId = 'searchTags'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        search: Joi.string().required()
    });
    const { error } = schema.validate(req.query);
    if (error) return respondError(res, error);

    const { search } = req.query;

    try {
        const tags = await controller.search(search as string);
        respond(res, Tag.MESSAGES.FETCHED(), tags);
    } catch (err) { respondError(res, err); }
});

// Get a tag by ID
router.get("/:id", async (req, res) => {
    /**
     * #swagger.tags = ['Tags']
     * #swagger.description = 'Get a tag by ID'
     * #swagger.operationId = 'getTag'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const { id } = req.params;

    try {
        const tag = await controller.get(parseInt(id));
        respond(res, Tag.MESSAGES.FETCHED(), tag);
    } catch (err) { respondError(res, err); }
});

export default router;
