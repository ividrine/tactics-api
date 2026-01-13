FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN mkdir -p /usr/app && chown -R node:node /usr/app
WORKDIR /usr/app
COPY package.json pnpm-lock.yaml ./

FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base
COPY --from=deps /usr/app/node_modules /usr/app/node_modules
COPY --chown=node:node . .
EXPOSE 3000