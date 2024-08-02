npm run generate
npm run migrate-deploy
npm run docs
npm run build
cp -r /app/src/openapi.json /app/dist/openapi.json
cp -r /app/src/langs /app/dist/
cp -r /app/src/mails /app/dist/
cd /app/dist
node index.js
