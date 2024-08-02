FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add python3 \
        make \
        g++ \
        cairo-dev \
        pango-dev \
        jpeg-dev \
        giflib-dev \
        librsvg-dev
RUN npm install
COPY . .
EXPOSE 8080
CMD ["sh", "./start-docker.sh"]
