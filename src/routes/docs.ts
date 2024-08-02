import swaggerUI from 'swagger-ui-express';
import Config from 'tools/Config.ts';
import express from 'express';
import { readFile } from 'fs';
import { getRootDir } from 'index.ts';

const router = express.Router();
const OPENAPI_PATH = getRootDir() + '/openapi.json';

router.get('/json', async (req, res) => {
    /**
     * #swagger.tags = ['Documentation']
     * #swagger.description = 'Get the OpenAPI JSON source file'
     * #swagger.operationId = 'getOpenAPIJSON'
     */
    res.sendFile(OPENAPI_PATH);
});

router.use('/', swaggerUI.serve);
router.get('/', (req, res) => {
    /**
     * #swagger.tags = ['Documentation']
     * #swagger.description = 'Get the OpenAPI documentation page'
     * #swagger.operationId = 'getOpenAPIDocumentation'
     */
    readFile(OPENAPI_PATH, (err, data) => {
        if (err) {
            res.send(err);
        } else {
            const json = JSON.parse(data.toString());
            res.send(swaggerUI.generateHTML(json, {
                customCss: '.swagger-ui .topbar { display: none }',
                customfavIcon: 'https://' + Config.webHost + '/img/favicon.png',
                customSiteTitle: 'FurWaz API - Documentation'
            }));
        }
    });
});

export default router;
