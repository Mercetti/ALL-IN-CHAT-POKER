# Helm Control Engine

Full Helm Control Engine repository skeleton with TypeScript and Expo mobile wiring, placeholder modules ready for LLM skill logic implementation.

## 🏗️ Architecture

### Core Components

- **Skill Registry**: Central registry of all available skills with metadata
- **Internal Skill Map**: Hidden internal skills for system operations
- **Permission Matrix**: Role-based access control for skills
- **Learning Boundaries**: Configurable learning constraints per skill
- **Skill Versioning**: Version control and rollback capabilities
- **Orchestrator**: Central execution engine with safety checks
- **LLM Orchestration**: Model routing and fallback management
- **Logging System**: Comprehensive logging with prioritization
- **Mobile App**: Expo-based React Native interface

## 📁 Repository Structure

```
acey-engine/
├─ src/
│  ├─ skills/
│  │  ├─ SkillRegistry.ts          # Skill definitions and registry
│  │  ├─ InternalSkillMap.ts      # Internal system skills
│  │  ├─ PermissionMatrix.ts      # Role-based permissions
│  │  ├─ LearningBoundaries.ts    # Learning constraints
│  │  └─ SkillVersioning.ts      # Version control
│  ├─ orchestrator/
│  │  ├─ Orchestrator.ts          # Central execution engine
│  │  └─ LLMOrchestration.ts     # Model management
│  ├─ logging/
│  │  ├─ Logger.ts               # Core logging system
│  │  └─ LogPrioritization.ts   # Log filtering and alerts
│  ├─ mobile/
│  │  └─ App.tsx                # Expo mobile app entry
│  └─ index.ts                  # Main entry point
├─ package.json                 # Dependencies and scripts
├─ tsconfig.json               # TypeScript configuration
└─ README.md                  # This file
```

## 🎯 Skills System

### Available Skills

1. **Audio Maestro** (Pro Tier)
   - Generates audio content and voice effects
   - LLM Models: GPT-5-mini → GPT-4-mini fallback

2. **Graphics Wizard** (Pro Tier)
   - Generates custom graphics and cosmetics
   - LLM Models: GPT-5-vision → GPT-4-vision fallback

3. **Code Helper** (Creator+ Tier)
   - Generates code snippets and validates logic
   - LLM Models: GPT-5-coder → GPT-4-coder fallback

4. **Content Optimizer** (Creator+ Tier)
   - Optimizes content for SEO and engagement
   - LLM Models: GPT-5-turbo → GPT-4-turbo fallback

5. **Data Analyzer** (Enterprise Tier)
   - Analyzes complex datasets and generates insights
   - LLM Models: GPT-5-analyst → GPT-4-analyst fallback

6. **Workflow Automator** (Enterprise Tier)
   - Automates complex workflows and processes
   - LLM Models: GPT-5-automation → GPT-4-automation fallback

### Internal Skills

- **Orchestrator Logic**: Coordinates all skill execution
- **Feedback Processor**: Processes feedback and tags memory
- **Safety Validator**: Validates against safety constraints
- **Performance Monitor**: Monitors performance and resources
- **Memory Manager**: Manages persistent memory
- **Escalation Handler**: Handles error escalation

## 🛡️ Safety & Permissions

### Permission Matrix

- **Role-based access**: Owner, Dev, User roles
- **Tier requirements**: Skills require specific subscription tiers
- **Usage limits**: Daily usage caps per skill
- **Approval requirements**: High-risk skills need approval

### Learning Boundaries

- **Learning control**: Per-skill learning enablement
- **Rate limiting**: Learning operations per day
- **Human validation**: Required for certain skills
- **Data retention**: Configurable retention periods

### Safety Constraints

- **No destructive actions**: Prevents harmful operations
- **Approval required**: Critical actions need human approval
- **Audit trails**: Complete logging of all actions
- **Rollback capability**: Immediate reversal of problematic changes

## 📱 Mobile App

### Navigation Structure

- **Status**: System overview and health monitoring
- **Control Panel**: Start/stop controls and mode selection
- **Demo Control**: Demo selection and execution
- **Logs**: Real-time log feed with filtering
- **Skill Store**: Skill installation and management
- **Settings**: Authentication and configuration
- **Notifications**: Push notification history
- **Financials**: Partner payouts and revenue

### Key Features

- **Real-time monitoring**: Live system status
- **Role-based access**: Different views for different roles
- **Offline support**: Cached data for offline viewing
- **Push notifications**: Real-time alerts and updates

## 🧪 Development

### Getting Started

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run development server
npm run dev

# Start mobile app
npm run mobile

# Run tests
npm test
```

### Skill Development

1. **Define skill interface** in `SkillRegistry.ts`
2. **Add permission entry** in `PermissionMatrix.ts`
3. **Configure learning boundaries** in `LearningBoundaries.ts`
4. **Set up LLM orchestration** in `LLMOrchestration.ts`
5. **Implement execution logic** in skill module

### LLM Integration

The system is designed for LLM code generation:

- **Modular interfaces**: Clear contracts for skill implementation
- **Type safety**: Comprehensive TypeScript definitions
- **Configuration-driven**: LLM models and parameters configurable
- **Fallback handling**: Automatic model fallback on failures
- **Safety first**: Built-in validation and constraints

## 📊 Logging & Monitoring

### Log Levels

- **CRITICAL**: System failures requiring immediate attention
- **ERROR**: Error conditions that need investigation
- **WARN**: Warning conditions that should be reviewed
- **INFO**: General information about system operation
- **DEBUG**: Detailed debugging information

### Log Prioritization

- **Automatic filtering**: Rules-based log categorization
- **Alert system**: Critical events trigger alerts
- **Escalation**: Automatic escalation for serious issues
- **Forwarding**: Integration with external monitoring systems

## 🚀 Deployment

### Environment Requirements

- **Node.js**: 18.0.0 or higher
- **TypeScript**: 5.2.0 or higher
- **Expo CLI**: Latest version for mobile development
- **Mobile**: iOS/Android development environment

### Production Deployment

```bash
# Build for production
npm run build

# Deploy server
npm start

# Build mobile app
npm run mobile:build
```

## 🔧 Configuration

### Environment Variables

- `NODE_ENV`: Development/production environment
- `LOG_LEVEL`: Minimum log level to output
- `API_BASE_URL`: Base URL for API calls
- `MOBILE_API_KEY`: Authentication key for mobile app

### Skill Configuration

Each skill can be configured with:

- **LLM models**: Primary and fallback models
- **Parameters**: Temperature, max tokens, etc.
- **Constraints**: Safety and usage limits
- **Learning**: Enable/disable learning features

## 📚 API Documentation

### Core Endpoints

- `POST /api/skills/execute` - Execute a skill
- `GET /api/skills/registry` - Get available skills
- `GET /api/skills/permissions` - Get user permissions
- `POST /api/skills/feedback` - Submit skill feedback

### Mobile Endpoints

- `GET /api/mobile/status` - Get system status
- `POST /api/mobile/auth` - Authenticate mobile app
- `GET /api/mobile/logs` - Get filtered logs
- `POST /api/mobile/notifications` - Send push notification

## 🤝 Contributing

### Development Guidelines

1. **TypeScript First**: All code must be strongly typed
2. **Safety First**: All features must include safety checks
3. **Testing**: Comprehensive test coverage required
4. **Documentation**: Clear documentation for all features
5. **Modularity**: Skills must be independent and reusable

### Pull Request Process

1. Fork repository
2. Create feature branch
3. Add tests and documentation
4. Submit pull request with description
5. Code review and merge

## 📄 License

MIT License - see LICENSE file for details

## 🆘️ Support

### Documentation

- [API Documentation](./docs/api.md)
- [Skill Development Guide](./docs/skills.md)
- [Mobile Development Guide](./docs/mobile.md)

### Community

- [GitHub Issues](https://github.com/acey-engine/issues)
- [Discord Community](https://discord.gg/acey)
- [Developer Forum](https://forum.acey.com)

---

**Acey Engine**: Professional AI orchestration platform with TypeScript and mobile support. Ready for LLM skill logic implementation and enterprise deployment.
