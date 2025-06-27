ARG PACKAGE

FROM node:23-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS pruner
ARG PACKAGE
ENV PACKAGE="${PACKAGE}"
WORKDIR /app
RUN pnpm add -g turbo
RUN turbo telemetry disable
COPY . .
RUN turbo prune @client/${PACKAGE} --docker

FROM base AS builder
ARG PACKAGE
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
COPY ./apps/client/${PACKAGE}/.env.develop ./apps/client/${PACKAGE}/.env
RUN pnpm generate
RUN NODE_ENV=production pnpm build --filter=@client/${PACKAGE} -v

FROM base AS web
ARG PACKAGE
WORKDIR /app
ENV NODE_ENV=production
ENV PACKAGE=${PACKAGE}

COPY --from=builder /app/apps/client/${PACKAGE}/.next/standalone ./
COPY --from=builder /app/apps/client/${PACKAGE}/.next/static ./apps/client/${PACKAGE}/.next/static
COPY --from=builder /app/apps/client/${PACKAGE}/public ./apps/client/${PACKAGE}/public

EXPOSE 3000

CMD node apps/client/${PACKAGE}/server.js
