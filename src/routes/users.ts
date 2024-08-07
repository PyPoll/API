import express from 'express';
import Joi from 'joi';
import * as controller from '../controllers/users.ts';
import { User } from 'models/User.ts';
import { respondError, respond } from 'tools/Responses.ts';
import { auth, mayAuth } from 'middleware/auth.ts';
import HTTPError from 'errors/HTTPError.ts';
import { createUserToken } from 'controllers/auth.ts';
const router = express.Router();

// Create a new user
router.post('/', async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Create a new user account'
     * #swagger.operationId = 'createUser'
     */
    const schema = Joi.object({
        pseudo: Joi.string().required(),
        email: Joi.string().email().required()
    });
    const { error } = schema.validate(req.body);
    if (error) return respondError(res, error);

    const { pseudo, email } = req.body;

    try {
        const user = await controller.createUser(pseudo, email);
        const token = await createUserToken(user.id);
        respond(res, User.MESSAGES.CREATED(), {user, token});
    } catch (err) { respondError(res, err); }
});

// Get own user
router.get('/me', auth, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Get the user that is logged in'
     * #swagger.operationId = 'getOwnUser'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const { token } = res.locals;

    try {
        const user = await controller.getPrivateUser(token.id);
        respond(res, User.MESSAGES.FETCHED(), user);
    } catch (err) { respondError(res, err); }
});

// Update own user
router.patch('/me', auth, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Update the user that is logged in'
     * #swagger.operationId = 'updateOwnUser'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.alt({
        pseudo: Joi.string().optional(),
        email: Joi.string().email().optional(),
        bio: Joi.string().optional().allow(''),
    });
    const { error } = schema.validate(req.body);
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const { pseudo, email, bio } = req.body;

    try {
        const newUser = await controller.updateUser(token.id, pseudo?.trim(), email?.trim(), bio?.trim());
        respond(res, User.MESSAGES.UPDATED(), newUser);
    } catch (err) {
        respondError(res, err);
    }
});

// Delete own user
router.delete('/me', auth, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Delete the user that is logged in'
     * #swagger.operationId = 'deleteOwnUser'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const { token } = res.locals;

    try {
        await controller.deleteUser(token.id);
        respond(res, User.MESSAGES.DELETED());
    } catch (err) { respondError(res, err); }
});

// Get a user by its ID
router.get('/:id', mayAuth, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Get a user by its ID'
     * #swagger.operationId = 'getUserById'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const id = parseInt(req.params.id);

    const shouldBePrivate = token?.id === id;

    try {
        const user = await (shouldBePrivate? controller.getPrivateUser: controller.getPublicUser)(id);
        if (!user) return respondError(res, User.MESSAGES.NOT_FOUND().buildHTTPError());
        respond(res, User.MESSAGES.FETCHED(), user);
    } catch (err) { respondError(res, err); }
});

// Update a user by its ID
router.patch('/:id', auth, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Update a user by its ID'
     * #swagger.operationId = 'updateUserById'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.alt({
        id: Joi.number().required(),
        pseudo: Joi.string().optional(),
        email: Joi.string().email().optional(),
        bio: Joi.string().optional().allow(''),
    });
    const { error } = schema.validate({ id: req.params.id, ...req.body });
    if (error) return respondError(res, error);

    const id = parseInt(req.params.id);
    const { token } = res.locals;
    const { pseudo, email, bio } = req.body;

    if (token.id !== id)
        return respondError(res, HTTPError.Unauthorized());

    try {
        const newUser = await controller.updateUser(id, pseudo?.trim(), email?.trim(), bio?.trim());
        respond(res, User.MESSAGES.UPDATED(), newUser);
    } catch (err) { respondError(res, err); }
});

// Delete a user by its ID
router.delete('/:id', auth, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Delete a user by its ID'
     * #swagger.operationId = 'deleteUserById'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate({ ...req.params });
    if (error) return respondError(res, error);

    const id = parseInt(req.params.id);
    const { token } = res.locals;

    if (id !== token.id)
        return respondError(res, HTTPError.Unauthorized());

    try {
        await controller.deleteUser(id);
        respond(res, User.MESSAGES.DELETED());
    } catch (err) { respondError(res, err); }
});

// Follow a user by its ID
router.post('/:id/follow', auth, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'Follow a user by its ID'
     * #swagger.operationId = 'followUserById'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const id = parseInt(req.params.id);

    try {
        await controller.follow(token.id, id);
        respond(res, User.MESSAGES.FOLLOWED());
    } catch (err) { respondError(res, err); }
});

// UnFollow a user by its ID
router.delete('/:id/follow', auth, async (req, res) => {
    /**
     * #swagger.tags = ['Users']
     * #swagger.description = 'UnFollow a user by its ID'
     * #swagger.operationId = 'unfollowUserById'
     * #swagger.security = [{ ApiKeyAuth: [] }]
     */
    const schema = Joi.object({
        id: Joi.number().required()
    });
    const { error } = schema.validate(req.params);
    if (error) return respondError(res, error);

    const { token } = res.locals;
    const id = parseInt(req.params.id);

    try {
        await controller.unfollow(token.id, id);
        respond(res, User.MESSAGES.UNFOLLOWED());
    } catch (err) { respondError(res, err); }
});

export default router;
