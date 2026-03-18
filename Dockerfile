FROM node:24-bookworm-slim AS build-base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app

FROM build-base AS build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/owner-ui/package.json ./apps/owner-ui/package.json
COPY apps/wallet-server/package.json ./apps/wallet-server/package.json
COPY packages/adapters-ckb/package.json ./packages/adapters-ckb/package.json
COPY packages/adapters-evm/package.json ./packages/adapters-evm/package.json
COPY packages/app-contracts/package.json ./packages/app-contracts/package.json
COPY packages/application/package.json ./packages/application/package.json
COPY packages/domain/package.json ./packages/domain/package.json
COPY packages/infrastructure/package.json ./packages/infrastructure/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps/owner-ui/index.html ./apps/owner-ui/index.html
COPY apps/owner-ui/tsconfig.json ./apps/owner-ui/tsconfig.json
COPY apps/owner-ui/vite.config.ts ./apps/owner-ui/vite.config.ts
COPY apps/owner-ui/src ./apps/owner-ui/src
COPY apps/wallet-server/tsconfig.build.json ./apps/wallet-server/tsconfig.build.json
COPY apps/wallet-server/src ./apps/wallet-server/src
COPY packages/adapters-ckb/tsconfig.json ./packages/adapters-ckb/tsconfig.json
COPY packages/adapters-ckb/src ./packages/adapters-ckb/src
COPY packages/adapters-evm/tsconfig.json ./packages/adapters-evm/tsconfig.json
COPY packages/adapters-evm/src ./packages/adapters-evm/src
COPY packages/app-contracts/tsconfig.json ./packages/app-contracts/tsconfig.json
COPY packages/app-contracts/src ./packages/app-contracts/src
COPY packages/application/tsconfig.json ./packages/application/tsconfig.json
COPY packages/application/src ./packages/application/src
COPY packages/domain/tsconfig.json ./packages/domain/tsconfig.json
COPY packages/domain/src ./packages/domain/src
COPY packages/infrastructure/tsconfig.json ./packages/infrastructure/tsconfig.json
COPY packages/infrastructure/src ./packages/infrastructure/src
COPY packages/shared/tsconfig.json ./packages/shared/tsconfig.json
COPY packages/shared/src ./packages/shared/src

RUN pnpm rebuild better-sqlite3
RUN pnpm build

FROM build-base AS prod-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/owner-ui/package.json ./apps/owner-ui/package.json
COPY apps/wallet-server/package.json ./apps/wallet-server/package.json
COPY packages/adapters-ckb/package.json ./packages/adapters-ckb/package.json
COPY packages/adapters-evm/package.json ./packages/adapters-evm/package.json
COPY packages/app-contracts/package.json ./packages/app-contracts/package.json
COPY packages/application/package.json ./packages/application/package.json
COPY packages/domain/package.json ./packages/domain/package.json
COPY packages/infrastructure/package.json ./packages/infrastructure/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --prod --frozen-lockfile
RUN pnpm rebuild better-sqlite3

FROM node:24-bookworm-slim AS runtime

ARG SUPERISE_BUILD_REF=
ARG SUPERISE_GIT_SHA=
ARG SUPERISE_BUILT_AT=

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production
ENV DEPLOYMENT_PROFILE=quickstart
ENV HOST=0.0.0.0
ENV PORT=18799
ENV DATA_DIR=/app/runtime-data
ENV SQLITE_PATH=/app/runtime-data/wallet.sqlite
ENV OWNER_NOTICE_PATH=/app/runtime-data/owner-credential.txt
ENV RUNTIME_SECRET_DIR=/app/runtime-data/secrets
ENV SUPERISE_BUILD_REF=$SUPERISE_BUILD_REF
ENV SUPERISE_GIT_SHA=$SUPERISE_GIT_SHA
ENV SUPERISE_BUILT_AT=$SUPERISE_BUILT_AT

RUN corepack enable

WORKDIR /app

COPY --from=prod-deps /app/package.json ./package.json
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps ./apps
COPY --from=prod-deps /app/packages ./packages

COPY --from=build /app/apps/owner-ui/dist ./apps/owner-ui/dist
COPY --from=build /app/apps/wallet-server/dist ./apps/wallet-server/dist
COPY --from=build /app/packages/adapters-ckb/dist ./packages/adapters-ckb/dist
COPY --from=build /app/packages/adapters-evm/dist ./packages/adapters-evm/dist
COPY --from=build /app/packages/app-contracts/dist ./packages/app-contracts/dist
COPY --from=build /app/packages/application/dist ./packages/application/dist
COPY --from=build /app/packages/domain/dist ./packages/domain/dist
COPY --from=build /app/packages/infrastructure/dist ./packages/infrastructure/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

EXPOSE 18799

CMD ["node", "apps/wallet-server/dist/main.js"]
