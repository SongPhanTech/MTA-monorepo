# ARG FILTER="*"
ARG FILTER="@client/ql-nguoi-dung"
ARG PACKAGE="ql-nguoi-dung"

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
ARG PACKAGE
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
COPY ./apps/client/${PACKAGE}/.env ./apps/client/${PACKAGE}/.env
RUN pnpm generate
RUN pnpm build --filter=${FILTER}

FROM base as web
ARG PACKAGE
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/client/${PACKAGE}/.next/standalone ./
COPY --from=builder /app/apps/client/${PACKAGE}/.next/static ./apps/${PACKAGE}/.next/static
COPY --from=builder /app/apps/client/${PACKAGE}/public ./apps/${PACKAGE}/public

CMD node apps/${PACKAGE}/server.js