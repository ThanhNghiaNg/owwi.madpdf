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

EXPOSE 5175

CMD ["npm", "start"]
