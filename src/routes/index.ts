import type { Request, Response } from 'express';
import { auth } from 'middleware/auth.ts';
import express from 'express';

import routerDocs from './docs.ts';
import routerAuth from './auth.ts';
import routerUsers from './users.ts';
import routerPolls from './polls.ts';
import routerTags from './tags.ts';
import routerMedias from './medias.ts';
import routerEmail from './email.ts';
import routerBeta from './beta.ts';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    /* #swagger.ignore = true */
    res.redirect('/docs');
});

router.use('/docs', routerDocs);
router.use('/auth', routerAuth);
router.use('/users', routerUsers);
router.use('/polls', auth, routerPolls);
router.use('/tags', auth, routerTags);
router.use('/medias', auth, routerMedias);
router.use('/email', routerEmail);
router.use('/beta', routerBeta);

export default router;
