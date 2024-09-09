import express from 'express';
import Joi from 'joi';
import * as controller from '../controllers/search.ts';
import HTTP from 'tools/HTTP.ts';
import { respondError, respond, ResponseMessage } from 'tools/Responses.ts';
import HTTPError from 'errors/HTTPError.ts';
import Lang from 'tools/Lang.ts';
import { ValidateMessages } from 'index.ts';
const router = express.Router();

// Search for something
router.get('/', async (req, res) => {
    /**
     * #swagger.tags = ['Search']
     * #swagger.description = 'Search for users or polls'
     * #swagger.operationId = 'search'
     */
    const schema = Joi.object({
        query: Joi.string().required().min(3),
        displayUsers: Joi.boolean().optional(),
        displayPolls: Joi.boolean().optional(),
    });
    const { error } = schema.validate(req.query, { errors: {language: Lang.getLanguage()}, messages: ValidateMessages });
    if (error) return respondError(res, error);
    const { query, displayUsers, displayPolls } = req.query;
    if (!query) return HTTPError.BadRequest();

    const showUsers = displayUsers ? (displayUsers === 'true') : false;
    const showPolls = displayPolls ? (displayPolls === 'true') : false;

    try {
        const users = showUsers? await controller.searchUsers(query.toString()) : undefined;
        const polls = showPolls? await controller.searchPolls(query.toString()) : undefined;
        respond(res, new ResponseMessage('Search results', HTTP.OK), {users, polls});
    } catch (err) { respondError(res, err); }
});

export default router;
