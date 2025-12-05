# Node 18 on Debian for better-sqlite3 prebuild/compile support
FROM node:18-bullseye-slim

WORKDIR /app

# Install build deps for native modules (better-sqlite3)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ sqlite3 \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies (force inclusion of package-lock.json)
COPY package.json package-lock.json ./
RUN test -f package-lock.json
RUN npm ci --omit=dev

# Copy source
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
