# Build BASE
FROM node:20-alpine3.21 as BASE

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable
RUN  yes | pnpm i \
    && pnpm cache delete 

# Build Image
FROM node:20-alpine3.21 AS BUILD

ARG env=product
ENV env=$env
WORKDIR /app
COPY --from=BASE /app/node_modules ./node_modules
COPY . .
COPY .env.${env} .env
RUN corepack enable
RUN apk add --no-cache curl \
    && pnpm generate \
    && pnpm build \
    && cd .next/standalone \
    && curl -sf https://gobinaries.com/tj/node-prune | sh -s -- -b /usr/local/bin \
    && node-prune --exclude test\
    && apk del curl
RUN pnpm rm xlsx
RUN pnpm install --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
# Build production
FROM node:20-alpine3.21 AS PRODUCTION

WORKDIR /app
RUN apk add --no-cache openssl
RUN apk add --no-cache libpq-dev
COPY --from=BUILD /app/public ./public
COPY --from=BUILD /app/next.config.js ./

# Set mode "standalone" in file "next.config.js"
COPY --from=BUILD /app/.next/standalone ./
COPY --from=BUILD /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
