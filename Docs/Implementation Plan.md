# **InstaCom Implementation Plan (v1.0)**

**Date:** January 21, 2026  
**Strategy:** AI-Driven Development (TDD), Modern Stack (React 19, Tailwind v4), Core Logic Focus.

---

## **1. Technology Stack & Configuration**

*   **Monorepo Structure:**
    *   `/Webapp`: Main Receiver App (React 19, Vite, Tailwind v4).
    *   `/Extension`: Chrome Extension (Manifest V3, React 19).
    *   `/apps/server`: Backend Relay (Node.js, Fastify, Socket.io w/ WebTransport).
    *   `/packages/shared`: Shared types and utilities.
*   **Audio Pipeline:**
    *   **Input:** `navigator.mediaDevices.getUserMedia`
    *   **Processing:** Client-side Noise Suppression via `rnnoise` (WASM).
    *   **Transport:** `socket.io` (configured with `transports: ['webtransport', 'websocket']`).
*   **Testing:** `vitest` with `jsdom` for frontend, `supertest` for backend.

---

## **2. Development Workflow (AI-Driven TDD)**

1.  **Define:** Create a spec for a unit of work (e.g., "AudioBuffer").
2.  **Test:** Generate a robust test suite (`.test.ts`) covering success and edge cases using AI.
3.  **Implement:** Generate the implementation code to pass the tests.
4.  **Refactor:** Optimize for readability and performance.
5.  **Document:** Update related documentation files immediately.

---

## **3. Phase 1: Project Initialization & Architecture**

### **Step 1.1: Scaffolding**
*   [ ] Initialize generic Node.js monorepo structure.
*   [ ] Configure `Webapp`: Vite + React 19 + Tailwind 4 (Alpha/Beta if stabile, or latest).
*   [ ] Configure `Extension`: Vite + CRXJS or custom build script.
*   [ ] Configure `apps/server`: Fastify + TypeScript.
*   [ ] **Doc Update:** Create `CHANGELOG.md` and initial `README.md`.

### **Step 1.2: Shared Infrastructure**
*   [ ] Setup `packages/shared` for Type definitions (`User`, `Message`, `SocketEvents`).
*   [ ] **TDD:** Create tests for shared validation logic.

---

## **4. Phase 2: Core Audio Engine (The "Heart")**

### **Step 2.1: Client-Side Audio Processing (WASM)**
*   [ ] **Task:** Integrate `rnnoise-wasm`.
*   [ ] **TDD:** Write tests for `AudioProcessor` class:
    *   Should initialize WASM context.
    *   Should accept Float32Array and return denoised Float32Array.
    *   Should handle context failure gracefully.
*   [ ] **Implementation:** Create `AudioProcessor.ts` in `apps/web` and `apps/extension`.

### **Step 2.2: The "Hub & Spoke" Transport**
*   [ ] **Task:** Setup Socket.io with WebTransport.
*   [ ] **TDD:** Write integration tests:
    *   Client A connects -> Server accepts.
    *   Client A emits binary -> Client B receives.
    *   Server filters Client A from recipients (Echo Cancellation).

---

## **5. Phase 3: The "Receiver" (Web App)**

### **Step 3.1: Audio Output & Buffering**
*   [ ] **TDD:** Test `JitterBuffer` class:
    *   Should queue incoming chunks.
    *   Should release chunks at fixed interval.
    *   Should handle buffer underflow/overflow.
*   [ ] **Implementation:** Build the audio playback engine using `AudioContext`.

### **Step 3.2: Idle Detection & Status**
*   [ ] **TDD:** Test `IdleManager`:
    *   Should trigger callback after N ms of inactivity.
    *   Should reset timer on user activity.

---

## **6. Phase 4: The "Sender" (Extension)**

### **Step 4.1: Audio Capture & Encoding**
*   [ ] **Task:** Capture Mic and encode to Opus/WebM.
*   [ ] **TDD:** Mock `MediaRecorder` and test event emission on data availability.

### **Step 4.2: Auto-Launch Logic**
*   [ ] **Task:** Ensure Extension opens Web App if closed.
*   [ ] **TDD:** Mock `chrome.tabs` API.
    *   Test: `findOrOpenTab` returns existing ID if found.
    *   Test: `findOrOpenTab` creates new tab if missing.

---

## **7. Phase 5: UI & Polish (React 19)**

Use Component Generation for:
*   **Visualizer:** Dynamic audio bars.
*   **PTT Button:** Responsive, tactile interactions.
*   **History List:** Clean list with playback controls.

---

## **8. Documentation & Audit Trail**

*   **Requirement:** Every file creation/edit must be accompanied by a log in `CHANGELOG.md`.
*   **Architecture Sync:** Ensure `Technical Architecture.md` is updated if strict constraints change during dev.
