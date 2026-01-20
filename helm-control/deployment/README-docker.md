# Helm Control Docker Deployment

## Quick Start

### 1. Pull your Helm Docker image

```bash
docker pull helmcontrol/helm:latest
```

### 2. Run with environment variables

```bash
docker run -d \
  -e HELM_API_KEY="YOUR_ENTERPRISE_KEY" \
  -e HELM_TIER="enterprise" \
  -p 3000:3000 \
  --name helm-instance \
  helmcontrol/helm:latest
```

### 3. Using Docker Compose

```bash
# Set your environment variables
export HELM_API_KEY="YOUR_ENTERPRISE_KEY"
export HELM_TIER="enterprise"

# Start with docker-compose
docker-compose up -d
```

## Environment Variables

| Variable | Required | Description | Default |
|----------|-----------|-------------|---------|
| `HELM_API_KEY` | Yes | Your client API key |
| `HELM_TIER` | Yes | Client tier (free/creator/creator+/enterprise) |
| `HELM_PORT` | No | Port to run on (default: 3000) |
| `NODE_ENV` | No | Environment (default: production) |
| `HELM_DATA_PATH` | No | Data storage path |

## Skill Access Management & Tier Enforcement

Helm dynamically filters skills per client tier:

| Tier | Skills Allowed | Features |
|-------|----------------|----------|
| **Free** | Basic monitoring, logs, simple alerts | Read-only access, rate limited |
| **Creator** | Full analytics, auto content, code fix | Execute permissions, higher limits |
| **Creator+** | Advanced analytics, custom integrations | Integration capabilities, API access |
| **Enterprise** | Self-hosted, all skills, integrations | Full admin, self-hosting option |

## Security Features

- ✅ **API Key Validation**: Every request validated against client key
- ✅ **Rate Limiting**: Configurable per-tier rate limits
- ✅ **Usage Monitoring**: Track and enforce usage limits
- ✅ **Skill Filtering**: Only allowed skills sent to clients
- ✅ **Audit Logging**: All actions logged for compliance
- ✅ **Health Checks**: Container health monitoring

## Volume Management

### Data Persistence
```bash
# Create named volume for data persistence
docker volume create helm_data

# Run with persistent storage
docker run -d \
  -v helm_data:/usr/src/helm/data \
  -e HELM_API_KEY="YOUR_KEY" \
  helmcontrol/helm:latest
```

### Log Management
```bash
# Mount local directory for logs
docker run -d \
  -v ./logs:/usr/src/helm/logs \
  -v helm_data:/usr/src/helm/data \
  -e HELM_API_KEY="YOUR_KEY" \
  helmcontrol/helm:latest
```

## Monitoring & Health

### Health Check Endpoint
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "uptime": 1234,
  "skills": 12,
  "memory": {
    "used": 256,
    "available": 768
  }
}
```

### Logs
```bash
# View container logs
docker logs helm-instance

# Follow logs in real-time
docker logs -f helm-instance
```

## Production Deployment

### Behind Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL/TLS Setup
```bash
# With SSL certificates
docker run -d \
  -v /path/to/certs:/usr/src/helm/certs \
  -e HELM_SSL_CERT_PATH=/usr/src/helm/certs/cert.pem \
  -e HELM_SSL_KEY_PATH=/usr/src/helm/certs/key.pem \
  -p 443:443 \
  helmcontrol/helm:latest
```

## Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml for multiple instances
version: '3.8'
services:
  helm-control-1:
    image: helmcontrol/helm:latest
    environment:
      - HELM_API_KEY=${HELM_API_KEY}
      - HELM_TIER=enterprise
    ports:
      - "3001:3000"
  
  helm-control-2:
    image: helmcontrol/helm:latest
    environment:
      - HELM_API_KEY=${HELM_API_KEY_2}
      - HELM_TIER=enterprise
    ports:
      - "3002:3000"
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### Load Balancer Configuration
```bash
# Using HAProxy or Nginx
# Configure round-robin load balancing across multiple Helm instances
```

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   ```bash
   # Verify your API key is correct and active
   curl -H "x-api-key: YOUR_KEY" http://localhost:3000/init
   ```

2. **Permission Denied**
   ```bash
   # Check if your tier allows the requested skill
   # Review client configuration in admin panel
   ```

3. **Memory Issues**
   ```bash
   # Monitor container memory usage
   docker stats helm-instance
   
   # Increase memory limit if needed
   docker run -d --memory="2g" helmcontrol/helm:latest
   ```

4. **Network Issues**
   ```bash
   # Check port mapping
   docker port inspect helm-instance
   
   # Verify firewall settings
   ```

## Support

- **Documentation**: https://docs.helmcontrol.com
- **Issues**: https://github.com/helmcontrol/helm/issues
- **Community**: https://discord.gg/helmcontrol

---

**Helm Control v2.0.0** - Containerized and ready for enterprise deployment.
