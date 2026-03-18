FROM node:24-bookworm-slim AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm rebuild better-sqlite3
RUN pnpm build

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

COPY --from=build /app /app

EXPOSE 18799

CMD ["node", "apps/wallet-server/dist/main.js"]
