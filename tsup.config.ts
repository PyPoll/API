// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
    banner: {
        js: `
            import {createRequire as __createRequire} from 'module';
            import {fileURLToPath as __fileURLToPath} from 'url';
            var require = __createRequire(import.meta.url);
            var __filename = __fileURLToPath(import.meta.url);
        `
    }
});
