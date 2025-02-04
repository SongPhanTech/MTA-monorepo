# ARG FILTER="*"
ARG FILTER="@client/ql-nguoi-dung"

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN npm install -g corepack@latest

FROM base AS pruner
ARG FILTER
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune --docker ${FILTER}

FROM base AS builder
ARG FILTER
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN pnpm generate
RUN pnpm build --filter=${FILTER}

FROM base as web
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/${FILTER}/.next/standalone ./
COPY --from=builder /app/apps/${FILTER}/.next/static ./apps/ql-nguoi-dung/.next/static
COPY --from=builder /app/apps/${FILTER}/public ./apps/ql-nguoi-dung/public

CMD node apps/${FILTER}/server.js