import { PrismaClient } from '@prisma/client'
import { fileURLToPath } from 'url';
import getReqLang from 'middleware/getReqLang.ts';
import Logger from 'tools/Logger.ts';
import Config from 'tools/Config.ts'
import busboy from 'connect-busboy';
import express from 'express';
import cors from 'cors';
import 'tools/Tasks.ts';

import joiEn from 'langs/en/joi.json' with { type: 'json' };
import joiFr from 'langs/fr/joi.json' with { type: 'json' };
const ValidateMessages = {
    en: joiEn,
    fr: joiFr
};

const prisma = new PrismaClient(Logger.prismaSettings);
const app = express();
Logger.init();

app.set('trust proxy', true);
app.use(cors({ origin: '*' }));
app.use(busboy({ limits: { fileSize: 10 * 1024 * 1024 } }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(getReqLang);

import('./routes/index.ts').then(router => app.use('/', router.default));

app.listen(Config.port, () => {
    console.info('Server is listening on port ' + Config.port);
});

function getRootDir() {
    return fileURLToPath(new URL('.', import.meta.url));
}

export { app, prisma, getRootDir, ValidateMessages };
