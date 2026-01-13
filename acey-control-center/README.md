# 🧠 Acey AI Control Center

Authority layer for Acey AI system - the single source of truth for all decisions.

## Architecture

```
Twitch Chat / Game Events → Web Server (WS) → Acey LLM → 
INTENT OUTPUT (JSON) → AI CONTROL CENTER (LOCAL) → 
Approved Actions / State → Web Server → Stream Output
```

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build TypeScript:
   ```bash
   npm run build
   ```

3. Start Control Center:
   ```bash
   npm start
   ```

4. Access dashboard at: http://localhost:3001

## Development

- `npm run dev` - Start with hot reload
- `npm run type-check` - Type checking only
- `npm run clean` - Clean build files

## Structure

- `src/contracts/` - TypeScript interfaces for intents and output
- `src/server/` - Express + Socket.IO server with validation
- `src/state/` - In-memory stores for memory, trust, persona
- `src/ui/` - React dashboard components

## Integration

Acey connects via WebSocket to send structured intents for approval and execution.
