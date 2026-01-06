# All-In AI Control Center

This Electron + React desktop app mirrors the All-In Chat Poker theme and surfaces every AI subsystem (Error Manager, Performance Optimizer, UX Monitor, Audio Generator, Self-Healing Middleware, Poker Audio System) in one place. It is meant to run locally so you can keep monitoring and triaging incidents even if the main website is unavailable.

## Getting Started

```bash
cd apps/ai-control-center
npm install
npm run dev
```

This boots two processes:

1. Vite dev server (React renderer)
2. Electron main process pointed at the dev server

For a packaged build:

```bash
npm run build   # bundle renderer
npm run start   # launch Electron against production build (dist/renderer)
```

## Structure

```text
apps/ai-control-center/
├── electron/
│   ├── main.ts          # Electron entry (windows, menus, auth storage wiring)
│   └── preload.ts       # Safe bridge exposing limited APIs to React
├── src/
│   ├── App.tsx          # Root React component, multi-panel layout
│   ├── components/      # Shared UI pieces matching site theme
│   ├── services/        # API client + offline cache stubs
│   ├── theme/           # Tokens and styles synchronized with the site
│   └── main.tsx         # React renderer bootstrap
├── tsconfig*.json
├── vite.config.ts       # Renderer bundler config
└── package.json
```

## Next Steps

- Hook up the API client (`src/services/api.ts`) to real endpoints with auth flow.
- Flesh out panels for each AI subsystem using `App.tsx` placeholders.
- Implement secure credential storage (Windows Credential Manager) so redist builds keep tokens safe.
- Add electron-builder config to generate signed installers once the UI is ready.

## Packaging & Distribution

1. Ensure the renderer build is fresh:

   ```bash
   npm run build
   ```

1. Generate a Windows installer (NSIS target by default):

   ```bash
   npm run package
   ```

   The bundled app appears under `dist/pkg/`. Share the installer with contractors together with env instructions (`VITE_BACKEND_BASE`, admin token).

1. Runtime tips:

   - Default runtime command is `node server.js` from repo root. Override via `AI_RUNTIME_CMD` / `AI_RUNTIME_ARGS`.
   - The desktop app stores chat history locally (no cloud dependency) and exposes Start/Stop controls for the local AI runtime via the Runtime panel.

## Code Signing

Electron Builder respects the following environment variables when packaging signed builds:

- `CSC_LINK`: Base64 or HTTPS link to your code-signing certificate (.p12/.pfx).
- `CSC_KEY_PASSWORD`: Password for the certificate.
- `WIN_CSC_LINK` / `WIN_CSC_KEY_PASSWORD`: Optional Windows-specific overrides.

Usage:

```bash
set CSC_LINK=<base64-cert>
set CSC_KEY_PASSWORD=<password>
npm run package
```

For macOS notarization add `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`.

## CI Automation

A sample GitHub Actions workflow (`.github/workflows/ai-control-center-build.yml`) is provided to:

1. Install dependencies.
2. Build the renderer + Electron app.
3. Upload the packaged installer artifact.

Set repository secrets (e.g., `CSC_LINK`, `CSC_KEY_PASSWORD`) before enabling signing in CI.
