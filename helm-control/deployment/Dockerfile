FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/helm

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Create data directory
RUN mkdir -p /usr/src/helm/data

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV HELM_PORT=3000
ENV HELM_DATA_PATH=/usr/src/helm/data

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "server.js"]
