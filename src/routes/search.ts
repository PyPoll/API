import express from 'express';
import Joi from 'joi';
import * as controller from '../controllers/search.ts';
import HTTP from 'tools/HTTP.ts';
import { respondError, respond, ResponseMessage } from 'tools/Responses.ts';
import HTTPError from 'errors/HTTPError.ts';
const router = express.Router();

// Search for something
router.get('/', async (req, res) => {
    /**
     * #swagger.tags = ['Search']
     * #swagger.description = 'Search for users or polls'
     * #swagger.operationId = 'search'
     */
    const schema = Joi.object({
        query: Joi.string().required().min(3)
        // TODO : add filters (users-only, polls-only, etc.)
    });
    const { error } = schema.validate(req.query);
    if (error) return respondError(res, error);
    const { query } = req.query;
    if (!query) return HTTPError.BadRequest();

    try {
        const users = await controller.searchUsers(query.toString());
        const polls = await controller.searchPolls(query.toString());
        respond(res, new ResponseMessage('Search results', HTTP.OK), {users, polls});
    } catch (err) { respondError(res, err); }
});

export default router;
