# **Technical Architecture Document**

Project: InstaCom (Web + Extension)  
Version: 1.1 (2026 AI-Standard Upgrade)  
Date: January 21, 2026

## **1. Executive Summary**

This document outlines the technical infrastructure, technology stack, and third-party dependencies required to build InstaCom. The system follows a **Hub-and-Spoke** architecture, where a centralized Node.js server relays real-time audio from "Spokes" (Chrome Extensions) to "Hubs" (Web Apps) while simultaneously archiving traffic to cloud storage.

## **2. High-Level Architecture**

### **2.1 Component Diagram**

* **Client A (Sender):** Chrome Extension (Manifest V3) -> Captures Mic -> **AI Denoise (WASM)** -> Encodes (Opus) -> Streams Chunks.  
* **Server (Relay):** Node.js Cluster -> Authenticates -> Filters Echo -> Broadcasts to Group -> Buffers to S3.  
* **Client B (Receiver):** React PWA -> Buffers Jitter -> Decodes -> Plays Audio.

### **2.2 Protocol Decision: WebSocket vs. WebRTC**

**Decision:** **WebSockets (Socket.io) over WebTransport.**

* **Why?** We utilize Socket.io v4+, explicitly enabling **WebTransport** as the preferred low-latency transport layer (HTTP/3), falling back to standard WebSockets/Polling if necessary. This grants us modern performance characteristics while retaining the robust "Room" and "Event" features of Socket.io for managing group broadcasts.

## **3. Technology Stack**

### **3.1 Frontend: Main Web App (The Receiver)**

* **Framework:** **React 19** (leveraging the new React Compiler for automatic optimization).  
* **Language:** **TypeScript** (Strict mode) for type safety across audio buffers.  
* **State Management:** **Zustand** (Lightweight, ideal for handling transient audio states).  
* **Styling:** **Tailwind CSS v4** (Oxy engine for rust-based high-performance compilation).  
* **Build Tool:** Vite.  
* **PWA Support:** vite-plugin-pwa (Essential for "App-like" installability and Service Worker management).

### **3.2 Frontend: Chrome Extension (The Sender)**

* **Manifest Version:** **V3** (Required by Google Store).  
* **Framework:** **React 19**.  
* **Audio Engine:** **rnnoise-wasm** (Client-side AI Noise Suppression) to filter background noise *before* encoding.
*   **Communication:** chrome.runtime messaging; Socket.io-client (WebTransport).

### **3.3 Backend: The Server**

* **Runtime:** **Node.js** (v20+ LTS).  
* **Framework:** **Fastify** (chosen for high-throughput performance).  
* **Real-Time Engine:** **Socket.io** (v4+) with WebTransport enabled.  
* **Audio Processing:** **FFmpeg** (Server-side) for converting raw chunks into standard MP3/WebM for storage.

### **3.4 Database & Storage**

* **Primary DB (Relational):** **PostgreSQL**.  
  * *Usage:* Users, Groups, Auth Tokens, Audit Logs, Message Metadata.  
  * *ORM:* **Prisma** (Typesafe DB access).  
* **Object Storage (Blob):** **AWS S3** (or generic S3-compatible provider like MinIO/DigitalOcean Spaces).  
  * *Usage:* Storing the finalized audio files for history playback.  
* **Cache (Optional but Recommended):** **Redis**.  
  * *Usage:* Tracking "Live" socket connections and ephemeral "Active/AFK" status to reduce DB writes.

## **4. Key Dependencies & Libraries**

### **4.1 Frontend Dependencies (package.json)**

| Package | Purpose |
| :---- | :---- |
| socket.io-client | Real-time bi-directional communication (WebTransport supported). |
| lucide-react | Lightweight iconography (Microphone, User, Status dots). |
| rnnoise-wasm | AI-based noise suppression. |
| opus-recorder / recordrtc | Capturing microphone input and encoding to lightweight Opus/WebM format client-side. |
| axios | Standard HTTP requests (Login, Fetch History). |
| date-fns | Timestamp formatting for history. |
| react-toastify | For "Are you still there?" and "New Message" toasts. |

### **4.2 Backend Dependencies (package.json)**

| Package | Purpose |
| :---- | :---- |
| socket.io | Server-side socket handling. |
| fastify | Web server framework. |
| pg | PostgreSQL driver. |
| prisma | Database ORM and migration tool. |
| jsonwebtoken | JWT generation and verification. |
| fluent-ffmpeg | Wrapper for FFmpeg to merge audio chunks into files. |
| @aws-sdk/client-s3 | Uploading finalized audio blobs to storage. |
| winston | Logging (crucial for Audit Logs). |

## **5. Data Flow & Audio Pipeline**

### **5.1 The "Live" Stream (Hot Path)**

1. **Capture:** Extension uses navigator.mediaDevices.getUserMedia.  
2. **Denoise:** Stream passed through `rnnoise` worklet node.
3. **Encode:** MediaRecorder API chunks audio into audio/webm;codecs=opus (approx 50ms chunks).  
4. **Transport:** Chunks emitted via Socket.io: socket.emit('voice-stream', chunk).  
5. **Relay:** Node.js server receives chunk.  
   * Look up Room Members.  
   * Filter out Sender.  
   * Filter out DND/AFK users (for live stream only).  
   * socket.to(recipientSocketId).emit('voice-stream', chunk).  
6. **Playback:** Receiver Web App pushes chunk into the MediaSource buffer or AudioContext queue.  
7. **Jitter Buffer:** Client delays playback by 150-200ms to ensure smooth sequencing.

### **5.2 The "History" Path (Cold Path)**

1. **Accumulate:** Node.js server pushes incoming chunks for a specific MessageID into a temporary memory buffer or local disk write stream.  
2. **Finalize:** On stream-end event:  
   * Flush buffer to a single file (e.g., msg_123.webm).  
   * Async Upload to S3 bucket /artifacts/{group_id}/{date}/.  
   * Write metadata to PostgreSQL messages table.  
3. **Cleanup:** Delete local temp file.

## **6. Security Architecture**

### **6.1 Authentication**

* **Method:** **JWT (JSON Web Tokens)**.  
* **Flow:**  
  1. User logs in on Web App -> Server returns HttpOnly Cookie (Refresh Token) and Access Token.  
  2. **Extension Sync:** Extension requests host_permissions for the Web App domain to read the HttpOnly cookie or localStorage token via chrome.cookies API.  
* **Socket Auth:** Socket connection handshake requires the JWT in the auth header.

### **6.2 Data Security**

* **Transit:** All WebSocket and HTTP traffic secured via **TLS (wss:// and https://)**.  
* **Storage:** S3 Buckets set to Private. Files accessed via **Presigned URLs** generated by the backend (TTL 1 hour).  
* **CORS:** Strict CORS policy allowing only the Web App domain and the specific Chrome Extension ID.

## **7. Development & DevOps Tools**

### **7.1 Local Development**

* **Docker Compose:** Orchestrate the local environment (Postgres DB + Redis + MinIO for local S3).  
* **Concurrently:** Run Frontend and Backend servers simultaneously in one terminal.

### **7.2 Deployment**

* **Frontend (Web App):** Vercel or Netlify (Zero-config CD).  
* **Backend:** Railway, Render, or AWS ECS (Dockerized Node app).  
* **Database:** Managed Postgres (Supabase, Neon, or AWS RDS).

### **7.3 CI/CD**

* **Vitest:** Unit and Integration Application testing.
*   *   *   *   *   *   *   *   *   *   *   *   *   *   *   *   *   *   *   **GitHub Actions:**  
  * On Push: Run Linting (ESLint) and Type Checking (TSC).  
  * On Merge to Main: Build Docker Image, Push to Registry, Trigger Deploy.

## **8. Resource Requirements**

* **Hardware (Server):**  
  * CPU: High single-core performance preferred for Node.js event loop.  
  * RAM: Sufficient to buffer chunks in memory before S3 upload (start with 2GB-4GB).  
* **Bandwidth:** High outbound bandwidth required for 1-to-Many broadcasting.