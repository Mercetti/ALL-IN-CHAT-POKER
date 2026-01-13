# Command Center Guide

## 🎯 Overview

The **Command Center** is a powerful web-based interface that provides one-click access to all your essential development and deployment commands. No more remembering complex terminal commands - just click and execute!

## 🚀 Quick Start

### Access the Command Center

1. **Start your servers:**
   ```bash
   # Main backend
   node server.js
   
   # AI Control Center
   cd acey-control-center && npm run dev
   ```

2. **Open the Command Center:**
   - Navigate to: http://localhost:3001
   - Click the "Command Center" tab
   - Or go directly to: http://localhost:3001/commands

## 📋 Available Commands

### 🏥 Health Check Commands

| Command | Description | One-Click Action |
|---------|-------------|------------------|
| **Check Local Health** | Verify local backend is running | Tests `http://localhost:8080/health` |
| **Check Production Health** | Verify production deployment | Tests `https://all-in-chat-poker.fly.dev/health` |

**What they do:**
- Send HTTP HEAD requests to health endpoints
- Return status codes and response headers
- Quick way to verify services are online

### 🚀 Deployment Commands

| Command | Description | One-Click Action |
|---------|-------------|------------------|
| **Check Fly.io Status** | Get current deployment status | Runs `fly status -a all-in-chat-poker` |
| **View Fly.io Logs** | Show recent deployment logs | Runs `fly logs -a all-in-chat-poker` |

**What they do:**
- Check deployment status on Fly.io
- View recent logs and error messages
- Monitor deployment progress

### 💻 Development Commands

| Command | Description | One-Click Action |
|---------|-------------|------------------|
| **Start Backend** | Start the local backend server | Runs `node server.js` |
| **Open AI Control Center** | Launch the AI Control Center UI | Opens `http://localhost:5173` |
| **Open Dashboard** | Launch the main dashboard | Opens `http://localhost:8080` |

**What they do:**
- Start development servers
- Open browser tabs to important URLs
- Quick access to development tools

### 📊 Monitoring Commands

| Command | Description | One-Click Action |
|---------|-------------|------------------|
| **Check Recent Logs** | View recent interaction logs | Fetches from `/api/logs?limit=10` |
| **View Statistics** | Get logging statistics | Fetches from `/api/logs/stats` |
| **List Workflows** | View fine-tuning workflows | Fetches from `/api/workflow/list` |

**What they do:**
- Retrieve system logs and metrics
- Monitor LLM interactions and performance
- Track fine-tuning workflow progress

### 🔧 Custom Commands

| Command | Description | Input Required |
|---------|-------------|----------------|
| **Custom cURL** | Execute any cURL command | ✅ Full cURL command |
| **Test Endpoint** | Test any API endpoint | ✅ Endpoint URL |

**What they do:**
- Execute custom cURL commands safely
- Test any API endpoint with proper error handling
- Great for debugging and testing

## 🎮 Using the Command Center

### Quick Command Execution

1. **Select a Category:**
   - 🏥 Health
   - 🚀 Deployment  
   - 💻 Development
   - 📊 Monitoring

2. **Click a Command:**
   - Instant execution for most commands
   - Some commands require input (marked with input field)

3. **View Results:**
   - Real-time output display
   - Error messages and status codes
   - Copy results to clipboard

### Custom Commands

#### Custom cURL
```bash
# Example inputs:
curl -X GET http://localhost:8080/api/logs/stats
curl -X POST http://localhost:8080/api/dataset/prepare -H "Content-Type: application/json" -d '{"taskTypes":["game"]}'
curl -I https://api.openai.com/v1/models
```

#### Test Endpoint
```bash
# Example inputs:
http://localhost:8080/health
https://jsonplaceholder.typicode.com/posts/1
http://localhost:8080/api/logs?limit=5
```

### System Status Overview

The Command Center provides a quick status dashboard with one-click access to:

- **Health Check** - Test local and production endpoints
- **Deployment Status** - Check Fly.io deployment
- **Development Tools** - Open UI and start servers
- **Monitoring** - View logs and statistics

## 🔒 Security Features

### Safe Command Execution
- **Whitelisted Commands**: Only allows safe commands (curl, node, npm, git, ls, ps, etc.)
- **Input Validation**: Validates all user inputs
- **Timeout Protection**: Commands timeout after 10 seconds
- **Error Handling**: Graceful error handling and reporting

### Restricted Operations
- **No File System Access**: Cannot read/write files
- **No System Commands**: Blocked dangerous commands (rm, sudo, etc.)
- **No Network Access**: Limited to whitelisted endpoints
- **No Privilege Escalation**: Cannot run privileged commands

## 📊 Command History

### Features
- **Automatic Logging**: All commands logged with timestamps
- **Output Storage**: Command outputs saved for reference
- **Quick Access**: Click history items to re-run commands
- **Clear History**: Option to clear command history

### History Benefits
- **Debugging**: Review previous command results
- **Documentation**: Keep track of useful commands
- **Productivity**: Quickly re-run frequent commands
- **Troubleshooting**: Compare command outputs over time

## 🛠️ Advanced Features

### Real-time Status Updates
- **Service Health**: Continuous monitoring of backend services
- **Response Times**: Track API response performance
- **Error Tracking**: Monitor error rates and patterns
- **System Metrics**: Memory, CPU, and uptime information

### Batch Operations
- **Multiple Commands**: Execute several commands in sequence
- **Parallel Execution**: Run non-dependent commands simultaneously
- **Conditional Logic**: Run commands based on previous results
- **Error Recovery**: Handle failures gracefully

### Integration with Development Workflow

#### Before Deployment
```bash
# Check local health
curl -I http://localhost:8080/health

# Run tests
npm test

# Check logs for errors
curl http://localhost:8080/api/logs?limit=10
```

#### During Deployment
```bash
# Check Fly.io status
fly status -a all-in-chat-poker

# Monitor deployment logs
fly logs -a all-in-chat-poker

# Test production health
curl -I https://all-in-chat-poker.fly.dev/health
```

#### After Deployment
```bash
# Verify production health
curl -I https://all-in-chat-poker.fly.dev/health

# Check production logs
curl https://all-in-chat-poker.fly.dev/api/logs/stats

# Open production dashboard
start https://all-in-chat-poker.fly.dev
```

## 🚀 Use Cases

### 1. **Daily Development**
```bash
# Start your development environment
- Start Backend
- Open AI Control Center
- Check Local Health
```

### 2. **Deployment Workflow**
```bash
# Before deployment
- Check Local Health
- View Statistics
- Check Recent Logs

# During deployment
- Check Fly.io Status
- View Fly.io Logs

# After deployment
- Check Production Health
- Open Dashboard
```

### 3. **Troubleshooting**
```bash
# Check service health
- Check Local Health
- Check Production Health

# Investigate issues
- View Recent Logs
- View Statistics
- Custom Endpoint Tests

# Monitor system
- System Status Overview
- Service Status Check
```

### 4. **API Testing**
```bash
# Test endpoints
- Custom Endpoint (http://localhost:8080/api/logs)
- Custom cURL (with headers and body)
- Health Checks
```

### 5. **Performance Monitoring**
```bash
# Check system performance
- View Statistics
- Check Recent Logs
- System Status Overview
```

## 📈 Benefits

### For Developers
- **Time Saving**: No more typing complex commands
- **Error Reduction**: Commands validated before execution
- **Consistency**: Standardized command execution
- **Documentation**: Built-in command descriptions

### For Operations
- **Quick Diagnostics**: Rapid health checks and status monitoring
- **Remote Access**: Execute commands from anywhere with web access
- **Audit Trail**: Complete command execution history
- **Safety**: Restricted command execution prevents accidents

### For Teams
- **Shared Knowledge**: Common commands available to all team members
- **Onboarding**: Easy for new team members to get started
- **Standardization**: Consistent command usage across team
- **Collaboration**: Share command results and troubleshooting steps

## 🔧 Customization

### Adding New Commands
To add custom commands, modify the `commands` array in `CommandCenter.tsx`:

```typescript
{
  id: "custom-command",
  name: "Custom Command",
  description: "Description of what it does",
  command: "your-command-here",
  category: "monitoring",
  endpoint: "http://localhost:8080/api/custom",
  method: "GET"
}
```

### Adding New Categories
```typescript
const categoryColors = {
  health: "bg-green-100 text-green-800 border-green-200",
  deployment: "bg-blue-100 text-blue-800 border-blue-200",
  development: "bg-purple-100 text-purple-800 border-purple-200",
  monitoring: "bg-yellow-100 text-yellow-800 border-yellow-200",
  custom: "bg-red-100 text-red-800 border-red-200" // New category
};

const categoryIcons = {
  health: "🏥",
  deployment: "🚀",
  development: "💻",
  monitoring: "📊",
  custom: "⚙️" // New category icon
};
```

## 🚨 Troubleshooting

### Common Issues

1. **Command Not Executing**
   - Check if backend server is running
   - Verify endpoint URLs are correct
   - Check network connectivity

2. **Permission Errors**
   - Commands are restricted for security
   - Use the custom endpoint feature for API testing
   - Contact admin for additional command access

3. **Timeout Errors**
   - Commands timeout after 10 seconds
   - Check if the command is hanging
   - Try running the command manually first

4. **Output Not Displaying**
   - Check browser console for JavaScript errors
   - Verify the command completed successfully
   - Check the command history for results

### Debug Mode
Enable debug mode by adding `?debug=true` to the URL:
```
http://localhost:3001/commands?debug=true
```

This will show:
- Detailed error messages
- Command execution timing
- Network request details
- System status information

## 🎉 Best Practices

### 1. **Use Health Checks First**
Always run health checks before other commands to verify services are running.

### 2. **Check Command History**
Review command history to understand previous actions and results.

### 3. **Use Custom Commands for Testing**
Use the custom endpoint feature for API testing instead of manual cURL commands.

### 4. **Monitor System Status**
Regularly check the system status overview to catch issues early.

### 5. **Document Workflows**
Use command history to document and repeat successful workflows.

---

## 🎉 Ready to Use!

The Command Center provides:

✅ **One-Click Execution** - No more typing complex commands  
✅ **Real-time Results** - Instant feedback and output  
✅ **Safety Features** - Secure command execution  
✅ **Command History** - Track and repeat commands  
✅ **System Monitoring** - Health checks and status updates  
✅ **Custom Testing** - Flexible endpoint testing  
✅ **Team Collaboration** - Shared command knowledge  
✅ **Error Handling** - Graceful failure recovery  

**🚀 Start commanding:**
```bash
# Start your servers
node server.js
cd acey-control-center && npm run dev

# Open Command Center
# http://localhost:3001 -> Command Center tab
```

The Command Center makes development and deployment operations effortless, safe, and efficient!
