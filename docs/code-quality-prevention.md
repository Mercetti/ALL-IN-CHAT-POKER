# Code Quality & Orphaned Code Prevention

## 1. Code Review Process

### PR Review Checklist
- [ ] **Duplicate Function Detection**: Search for function names before adding new ones
- [ ] **Server Startup Check**: Verify only one `server.listen()` call exists
- [ ] **Route Duplication**: Check for duplicate route definitions
- [ ] **Module Organization**: Ensure moved code is deleted from original location
- [ ] **Import Cleanup**: Remove unused imports after refactoring

### Review Commands
```bash
# Check for duplicate function definitions
grep -n "function " server.js | sort | uniq -D

# Check for multiple server.listen calls
grep -n "server.listen" server.js

# Find duplicate route definitions
grep -n "app\.\(get\|post\|put\|delete\)" server.js | sort
```

## 2. Automated Detection

### ESLint Configuration
```json
{
  "rules": {
    "no-duplicate-imports": "error",
    "no-shadow": "error",
    "no-redeclare": "error",
    "custom/no-duplicate-functions": "error",
    "custom/single-server-listen": "error"
  }
}
```

### Custom ESLint Rules
```javascript
// .eslintrc.js - Custom rules for duplicate detection
module.exports = {
  rules: {
    'custom/no-duplicate-functions': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent duplicate function definitions'
        }
      },
      create(context) {
        const functionNames = new Set();
        return {
          FunctionDeclaration(node) {
            const name = node.id?.name;
            if (name && functionNames.has(name)) {
              context.report({
                node,
                message: `Duplicate function definition: ${name}`
              });
            }
            functionNames.add(name);
          }
        };
      }
    },
    'custom/single-server-listen': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Ensure only one server.listen() call exists'
        }
      },
      create(context) {
        let listenCount = 0;
        return {
          CallExpression(node) {
            if (node.callee?.object?.name === 'server' && 
                node.callee?.property?.name === 'listen') {
              listenCount++;
              if (listenCount > 1) {
                context.report({
                  node,
                  message: 'Multiple server.listen() calls detected'
                });
              }
            }
          }
        };
      }
    }
  }
};
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run check-duplicates",
      "pre-push": "npm run audit-orphaned"
    }
  },
  "lint-staged": {
    "*.js": ["eslint --fix", "prettier --write"]
  },
  "scripts": {
    "check-duplicates": "node scripts/check-duplicates.js",
    "audit-orphaned": "node scripts/audit-orphaned.js"
  }
}
```

## 3. Refactoring Discipline

### Refactoring Checklist
- [ ] **Identify Target Functions**: List all functions to be moved
- [ ] **Create Module Structure**: Set up new module files
- [ ] **Move Functions**: Transfer code to new modules
- [ ] **Update Imports**: Add necessary imports to new modules
- [ ] **Delete Original Code**: Remove functions from original location
- [ ] **Test Functionality**: Verify everything still works
- [ ] **Update Documentation**: Reflect new structure

### Safe Refactoring Process
```bash
# 1. Find all functions to move
grep -n "function.*Action" server.js

# 2. Create backup before refactoring
cp server.js server.js.backup

# 3. After moving, verify deletion
grep -n "function.*Action" server.js # Should return empty

# 4. Test server still starts
npm start
```

### Module Organization Template
```javascript
// Example: server/game-actions/poker-actions.js
const { db } = require('../database');
const { getStateForChannel } = require('../game-state');

/**
 * Poker action handlers
 * Moved from server.js to improve organization
 */

function pokerFoldAction(login, channel = DEFAULT_CHANNEL) {
  // Implementation here
}

function pokerCallAction(login, channel = DEFAULT_CHANNEL) {
  // Implementation here
}

function pokerRaiseAction(login, amount, channel = DEFAULT_CHANNEL) {
  // Implementation here
}

module.exports = {
  pokerFoldAction,
  pokerCallAction,
  pokerRaiseAction
};
```

## 4. Regular Cleanup

### Monthly Technical Debt Sprint
```bash
# scripts/monthly-cleanup.sh
#!/bin/bash

echo "🧹 Starting monthly cleanup..."

# 1. Check for unused imports
npx eslint . --rule 'no-unused-imports'

# 2. Find duplicate functions
node scripts/check-duplicates.js

# 3. Identify dead code
npx eslint . --rule 'no-unreachable'

# 4. Check console.log statements
grep -r "console.log" server/ --exclude-dir=node_modules

# 5. Find TODO/FIXME comments
grep -r "TODO\|FIXME" server/ --exclude-dir=node_modules

echo "✅ Monthly cleanup complete"
```

### Weekly Code Health Check
```javascript
// scripts/weekly-health-check.js
const fs = require('fs');
const path = require('path');

function checkCodeHealth() {
  const issues = [];
  
  // Check server.js for common issues
  const serverContent = fs.readFileSync('server.js', 'utf8');
  
  // Multiple server.listen calls
  const listenMatches = serverContent.match(/server\.listen/g);
  if (listenMatches && listenMatches.length > 1) {
    issues.push('Multiple server.listen() calls found');
  }
  
  // Duplicate function definitions
  const functionMatches = serverContent.match(/function\s+(\w+)/g);
  if (functionMatches) {
    const functions = functionMatches.map(f => f.replace('function ', ''));
    const duplicates = functions.filter((f, i) => functions.indexOf(f) !== i);
    if (duplicates.length > 0) {
      issues.push(`Duplicate functions: ${duplicates.join(', ')}`);
    }
  }
  
  // Report issues
  if (issues.length > 0) {
    console.log('🚨 Code Health Issues:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('✅ Code health looks good!');
  }
}

checkCodeHealth();
```

## 5. Better Git Hygiene

### Branch Management Strategy
```bash
# Feature branch workflow
git checkout -b feature/new-game-mode
# Make changes
git add .
git commit -m "feat: add new game mode"

# Before merging
git checkout main
git pull origin main
git checkout feature/new-game-mode
git rebase main

# Merge cleanly
git checkout main
git merge --no-ff feature/new-game-mode
git branch -d feature/new-game-mode
```

### Conflict Resolution Guidelines
```bash
# When conflicts occur:
# 1. Identify conflict markers
git status

# 2. Review each conflict carefully
# Don't just keep both versions!

# 3. Use merge tools for better visualization
git mergetool

# 4. Test after resolution
npm test
npm start

# 5. Commit resolution
git add .
git commit -m "resolve: merge conflicts in game handlers"
```

### Pre-merge Validation
```bash
# scripts/pre-merge-check.sh
#!/bin/bash

echo "🔍 Pre-merge validation..."

# 1. Check for duplicate server.listen
if [ $(grep -c "server.listen" server.js) -gt 1 ]; then
  echo "❌ Multiple server.listen() calls detected!"
  exit 1
fi

# 2. Check for duplicate functions
duplicates=$(grep -o "function [a-zA-Z_][a-zA-Z0-9_]*" server.js | sort | uniq -d)
if [ ! -z "$duplicates" ]; then
  echo "❌ Duplicate functions detected: $duplicates"
  exit 1
fi

# 3. Run tests
npm test

# 4. Check linting
npm run lint

echo "✅ Pre-merge validation passed"
```

## Implementation Timeline

### Week 1: Setup Detection
- Configure ESLint rules
- Set up pre-commit hooks
- Create duplicate detection scripts

### Week 2: Review Process
- Implement PR review checklist
- Add automated checks to CI/CD
- Train team on review process

### Week 3: Refactoring Discipline
- Document refactoring procedures
- Create module templates
- Establish backup/restore procedures

### Week 4: Maintenance
- Schedule monthly cleanup sprints
- Set up weekly health checks
- Implement Git hygiene training

## Success Metrics

- **Zero duplicate function definitions**
- **Single server.listen() call**
- **No unused imports**
- **Clean module organization**
- **Consistent code review process**

This systematic approach should prevent the accumulation of orphaned code that caused the recent server.js cleanup effort.
