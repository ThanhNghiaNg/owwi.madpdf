FROM node:24-bookworm-slim AS version_builder

WORKDIR /src

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN if [ -d .git ]; then git rev-parse --short HEAD > /commit_hash; else echo dev > /commit_hash; fi

FROM node:24-bookworm-slim

ENV NODE_ENV=production \
    PORT=5175

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ghostscript ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .
COPY --from=version_builder /commit_hash ./.commit_hash

EXPOSE 5175

CMD ["npm", "start"]
