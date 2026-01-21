# Helm Control Enterprise Docker Deployment
# Obfuscated binary with tamper detection and mandatory license check-in

FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 helm && \
    adduser -u 1001 -G helm -s /bin/sh -D helm

# Set working directory
WORKDIR /app

# Copy license files (read-only)
COPY --chown=helm:helm ./license/ /license/
RUN chmod 400 /license/*

# Copy obfuscated binary
COPY --chown=helm:helm ./dist/helm-engine.obf /app/helm-engine
RUN chmod 500 /app/helm-engine

# Copy configuration templates
COPY --chown=helm:helm ./config/ /app/config/
RUN chmod 444 /app/config/*

# Copy startup script with tamper detection
COPY --chown=helm:helm ./scripts/enterprise-start.sh /app/start.sh
RUN chmod 500 /app/start.sh

# Create required directories
RUN mkdir -p /app/logs /app/data /app/tmp && \
    chown -R helm:helm /app

# Set environment variables
ENV NODE_ENV=production
ENV HELM_LICENSE_PATH=/license/helm.json
ENV HELM_CHECKIN_REQUIRED=true
ENV HELM_TAMPER_DETECTION=true
ENV HELM_OBFUSCATED=true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Switch to non-root user
USER helm

# Expose port
EXPOSE 8080

# Start with dumb-init
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/app/start.sh"]
