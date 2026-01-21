# Helm Control Documentation

## Overview

Helm Control is infrastructure for safe, deployable AI operators. This documentation site provides comprehensive guides, API references, and examples to help you integrate Helm Control into your applications.

## Quick Links

- [Quick Start](/docs/quick-start) - Get up and running in minutes
- [API Reference](/docs/api) - Complete API documentation
- [Integration Guides](/docs/integration) - Step-by-step tutorials
- [Examples](/docs/examples) - Real-world usage examples
- [Troubleshooting](/docs/troubleshooting) - Common issues and solutions

## Getting Started

### Installation

```bash
npm install @helm/control
```

### Basic Usage

```typescript
import { HelmClient } from '@helm/control';

const helm = new HelmClient({
  apiKey: 'your-api-key',
  environment: 'hosted'
});

const session = helm.startSession({
  domain: 'web',
  userId: 'user123'
});

const response = await session.send('Hello!');
console.log(response);

session.end();
helm.shutdown();
```

## Development

This documentation site is built with Next.js and React.

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT License - see LICENSE file for details.
