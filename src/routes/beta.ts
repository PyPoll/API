import { respondError } from 'tools/Responses.ts';
const router = express.Router();
import express from 'express';
import HTTPError from 'errors/HTTPError.ts';
import Joi from 'joi';
import { prisma } from 'index.ts';

router.post('/register', async (req, res) => {
    /**
     * #swagger.tags = ['Beta']
     * #swagger.description = 'Register to the beta'
     * #swagger.operationId = 'registerBeta'
     */
    try {
        const schema = Joi.object({
            email: Joi.string().email().required()
        });
        const { error } = schema.validate(req.body);
        if (error) return respondError(res, error);

        const { email } = req.body;
        const alreadyExists = await prisma.user.findUnique({ where: { email } });
        if (alreadyExists)
            throw new HTTPError(400, 'Email already registered');

        const exists = await prisma.beta.findUnique({ where: { email } });
        if (exists) throw new HTTPError(400, 'Email already registered');
        await prisma.beta.create({ data: { email } });
        
        res.send({ message: 'Email sent' });
    } catch (err) { respondError(res, err); }
});

// SEND BETA MAIL
// Mailer.sendMail(
//     email,
//     Mail.fromFile(
//         Lang.GetText(Lang.CreateTranslationContext('emailBeta', 'Title')),
//         getRootDir() + 'mails/emailButton.html',
//         getRootDir() + 'mails/emailButton.txt',
//         {
//             Title: Lang.GetText(Lang.CreateTranslationContext('emailBeta', 'Title')),
//             FloorText1: Lang.GetText(Lang.CreateTranslationContext('emailBeta', 'FloorText1')),
//             FloorText2: Lang.GetText(Lang.CreateTranslationContext('emailBeta', 'FloorText2')),
//             ButtonText: Lang.GetText(Lang.CreateTranslationContext('emailBeta', 'ButtonText')),
//             GroundText: Lang.GetText(Lang.CreateTranslationContext('emailBeta', 'GroundText')),
//             Footer1: Lang.GetText(Lang.CreateTranslationContext('emailBeta', 'Footer1')),
//             Footer2: Lang.GetText(Lang.CreateTranslationContext('emailBeta', 'Footer2')),
//             ButtonLink: `https://${Config.webHost}`
//         }
//     )
// );

export default router;
