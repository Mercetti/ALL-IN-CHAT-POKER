# Node 18 on Debian for better-sqlite3 prebuild/compile support
FROM node:18-bullseye-slim

WORKDIR /app

# Install build deps for native modules (better-sqlite3)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ sqlite3 \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies (prefer lockfile but don't fail if absent)
COPY package*.json ./
# Prefer deterministic install; fall back to npm install if lock is absent
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy source
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
