# InstaCom (2026 AI-Driven Edition)

**InstaCom** is a real-time group intercom application designed for high-performance teams. It provides "Walkie-Talkie style" instant voice communication, voice notes, and persistent history.

**Status:** Alpha 0.1 (Architecture & MVPs)

## 🚀 Key Features (MVP)
- **Instant Voice PTT**: High-performance "Push-to-Talk" interface.
- **AI Noise Suppression**: Client-side WASM-based noise removal (stubbed for future rnnoise integration).
- **Group Channels**: Socket.io based real-time rooms.
- **Cross-Platform**: Web Application (React 19) + Chrome Extension (Manifest V3).

## 🛠 Tech Stack
- **Frontend**: React 19 RC, Tailwind CSS v3.4 (v4 prepared but paused for stability), Vite.
- **Backend**: Node.js, Fastify, Socket.io (WebTransport ready).
- **Extension**: Manifest V3, Service Workers, React Popup.
- **Monorepo**: NPM Workspaces (`Webapp`, `Extension`, `apps/server`, `packages/shared`).

## 🔧 Setup & Development

### Prerequisites
- Node.js v20+
- NPM 10+

### Installation
```bash
npm install --legacy-peer-deps
```

### Running Locally
To start the entire system (Server + WebApp):
```bash
npm run dev
```

- **Web App**: http://localhost:5173
- **Server**: http://localhost:3000

### Running Tests
```bash
npm test
# OR specific workspace
npm test --workspace=apps/server
npm test --workspace=Webapp
```

## 📂 Project Structure
- `Webapp/`: Main dashboard PWA.
- `Extension/`: Chrome Extension for sidebar usage.
- `apps/server/`: Real-time signaling and relay server.
- `packages/shared/`: Shared types and logic.
- `Docs/`: Detailed architecture and requirements.

## 📝 Development Logs
See [DEV_LOG.md](./DEV_LOG.md) for detailed phase tracking and [ERROR_LOG.md](./ERROR_LOG.md) for troubleshooting history.
