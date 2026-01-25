# CI/CD Pipeline Setup Guide

## Overview

This document describes the comprehensive CI/CD pipeline for the All-In Chat Poker project, implemented using GitHub Actions and Fly.io for deployment.

## 🚀 Pipeline Architecture

### Triggers
- **Push to main/develop**: Triggers full pipeline
- **Pull requests**: Triggers test suite only
- **Manual dispatch**: Allows manual pipeline execution

### Pipeline Stages

#### 1. Testing Phase
- **Backend Tests**: Server-side functionality testing
- **Mobile Tests**: React Native component testing
- **E2E Tests**: End-to-end application testing
- **Performance Tests**: Performance benchmarking
- **Security Scan**: Vulnerability assessment

#### 2. Quality Gates
- Aggregates all test results
- Generates comprehensive quality report
- Enforces quality thresholds

#### 3. Build & Deploy
- Builds application for production
- Deploys to Fly.io
- Performs health checks

#### 4. Release
- Generates release notes
- Creates GitHub release
- Tags deployment version

## 📋 Required Secrets

### GitHub Repository Secrets
Add these secrets to your GitHub repository settings:

1. **FLY_API_TOKEN**
   - Your Fly.io API token
   - Required for deployment
   - Get from: `flyctl auth token`

2. **DISCORD_PUBLIC_KEY** (optional)
   - Discord application public key
   - For Discord integration

3. **DISCORD_CLIENT_ID** (optional)
   - Discord application client ID

4. **DISCORD_CLIENT_SECRET** (optional)
   - Discord application client secret

## 🔧 Local Development Setup

### Prerequisites
- Node.js 18+
- Fly.io CLI (`flyctl`)
- GitHub CLI (optional)

### Setup Steps

1. **Install Fly.io CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Authenticate with Fly.io**
   ```bash
   flyctl auth login
   ```

3. **Test Local Pipeline**
   ```bash
   # Run tests locally
   npm run test:smoke
   npm run test:components
   npm run test:parallel
   
   # Test deployment locally
   flyctl deploy --local-only
   ```

## 📊 Test Optimization

### Test Scripts
The pipeline includes optimized test scripts:

- **`npm run test:smoke`**: Quick validation (30-60s)
- **`npm run test:components`**: Component testing (60-120s)
- **`npm run test:backend`**: Backend testing (120-240s)
- **`npm run test:mobile`**: Mobile testing (60-180s)
- **`npm run test:parallel`**: Full parallel testing (180-300s)
- **`npm run test:coverage`**: Coverage reporting (240-420s)

### Performance Monitoring
- Real-time test execution metrics
- Performance regression detection
- Automated performance reporting

## 🚀 Deployment Configuration

### Fly.io Configuration
The application is configured for deployment to Fly.io with:

- **App Name**: `all-in-chat-poker`
- **Primary Region**: `iad` (Iowa)
- **Database**: Persistent SQLite storage
- **Health Checks**: Automated health monitoring
- **Auto-scaling**: Configurable machine scaling

### Environment Variables
Production environment variables are managed in `fly.toml`:

```toml
[env]
  NODE_ENV = "production"
  PORT = "8080"
  HOST = "0.0.0.0"
  DB_FILE = "/data/data.db"
  DATABASE_URL = "sqlite:/data/data.db"
```

## 🔍 Quality Gates

### Quality Metrics
The pipeline enforces quality thresholds:

- **Test Coverage**: Minimum 70% required
- **Test Pass Rate**: 100% for critical tests
- **Performance Score**: Minimum 80/100
- **Security Score**: Minimum 90/100

### Quality Report
Automated quality report includes:
- Test results summary
- Coverage analysis
- Performance metrics
- Security assessment
- Recommendations for improvement

## 📈 Monitoring & Alerts

### Health Monitoring
- Application health endpoint: `/health`
- Database connectivity checks
- Resource utilization monitoring
- Error rate tracking

### Deployment Monitoring
- Deployment success/failure notifications
- Rollback capabilities
- Performance regression detection
- Security vulnerability alerts

## 🔄 Rollback Procedures

### Manual Rollback
```bash
# Rollback to previous deployment
flyctl deploy --rollback

# Check deployment history
flyctl deployments list

# Monitor rollback status
flyctl logs
```

### Automatic Rollback
- Health check failures trigger automatic rollback
- Performance degradation triggers rollback
- Security vulnerabilities trigger rollback

## 🛠️ Troubleshooting

### Common Issues

#### 1. Test Failures
- Check test logs in GitHub Actions
- Run tests locally with `npm run test:smoke`
- Review test coverage reports

#### 2. Deployment Failures
- Check Fly.io deployment logs
- Verify environment variables
- Check application health endpoint

#### 3. Performance Issues
- Review performance test results
- Check application metrics
- Optimize test execution

### Debug Commands
```bash
# Check deployment status
flyctl status

# View application logs
flyctl logs

# Check health endpoint
curl https://all-in-chat-poker.fly.dev/health

# Monitor resource usage
flyctl vm list
```

## 📚 Best Practices

### Development Workflow
1. Create feature branches from `develop`
2. Write tests for new features
3. Run local tests before pushing
4. Create pull requests to `develop`
5. Merge to `main` for production deployment

### Testing Best Practices
- Write unit tests for all new features
- Maintain test coverage above 70%
- Use descriptive test names
- Mock external dependencies
- Test edge cases and error conditions

### Deployment Best Practices
- Test deployments in staging first
- Monitor deployment health
- Keep deployment scripts simple
- Document deployment procedures
- Use semantic versioning

## 🔗 Additional Resources

### Documentation
- [Fly.io Documentation](https://fly.io/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Testing Documentation](https://jestjs.io/docs/getting-started)

### Tools
- [GitHub Actions](https://github.com/features/actions)
- [Fly.io](https://fly.io/)
- [Jest](https://jestjs.io/)
- [Playwright](https://playwright.dev/)

### Monitoring
- [Fly.io Metrics](https://fly.io/docs/reference/metrics/)
- [GitHub Actions Monitoring](https://docs.github.com/en/actions/monitoring-workflows)

---

*Last updated: ${new Date().toLocaleDateString()}*
