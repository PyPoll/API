import Config from '../config.json' assert { type: 'json' };
import swaggerAutogen from 'swagger-autogen';
import { URL, fileURLToPath } from 'url';
import ts from 'typescript';
import { readdir } from 'fs';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const OPENAPI_PATH = rootDir + '/openapi.json';

function type2example(type) {
    switch (type) {
        case 'string': return 'string';
        case 'number': return 0;
        case 'boolean': return true;
        case 'Date': return new Date();
        case 'any': return null;
        case 'string[]': return ['string'];
        case 'number[]': return [0];
        case 'boolean[]': return [true];
        case 'Date[]': return [new Date()];
        case 'any[]': return [null];
        default: return null;
    }
}

function getModelsDefinitions() {
    return new Promise((resolve, reject) => {
        const modelsPath = rootDir + '/models/';
        const models = {};
        
        readdir(modelsPath, (err, files) => {

            if (err) { reject(err); return; }
            files.forEach((file) => {
                if (!file.endsWith('.ts')) return;

                const program = ts.createProgram([modelsPath + file], {});
                const checker = program.getTypeChecker();
                const sourceFile = program.getSourceFile(modelsPath + file);
                if (!sourceFile) return;

                for (const statement of sourceFile.statements) {
                    if (!ts.isInterfaceDeclaration(statement)) continue;
                    const type = checker.getTypeAtLocation(statement);
                    const model = {};
                    type.getProperties().forEach(property => {
                        const name = property.getName();
                        const type = checker.typeToString(checker.getTypeOfSymbolAtLocation(property, property.valueDeclaration));
                        model[name] = type2example(type);
                    });
                    models[statement.name.text] = model;
                }
            });

            resolve(models);
        });
    });
}

async function generateJSONFile() {
    return new Promise((resolve, reject) => {
        getModelsDefinitions().then(models => {

            const infos = {
                info: {
                    title: 'Pypoll API Documentation',
                    description: 'Documentation for the Pypoll API',
                    version: '1.0.0',
                    contact: {
                        name: 'FurWaz',
                        url: 'https://furwaz.com',
                        email: 'contact@furwaz.com'
                    }
                },
                host: Config.host,
                basePath: '/',
                schemes: [Config.host.startsWith('localhost')? 'http' : 'https'],
                consumes: ['application/json'],
                produces: ['application/json'],
                definitions: models,
                components: {
                    securitySchemes: {
                        ApiKeyAuth: {
                            type: 'apiKey',
                            in: 'header',
                            name: 'authorization'
                        }
                    }
                },
                securityDefinitions: {
                    ApiKeyAuth: {
                        type: 'apiKey',
                        in: 'header',
                        name: 'authorization'
                    }
                }
            };
    
            const routes = ['./routes/index.ts'];
    
            swaggerAutogen()(OPENAPI_PATH, routes, infos)
                .then((res) => { if (typeof(res) === 'boolean' || !res.success) reject('Error during SwaggerAutogen') })
                .catch(err => { reject(err) });
        }).catch(reject);
    });
}

generateJSONFile();
