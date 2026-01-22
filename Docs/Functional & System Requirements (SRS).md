# **System Requirements Specification (SRS) & FRD**

Project: InstaCom (Web \+ Extension)  
Version: 3.1 (Aligned with Process Maps)

## **1\. System Architecture**

* **Web App (Host):** React SPA. Handles WebSocket (Receive), AudioContext (Play), and Idle Detection.  
* **Chrome Extension (Client):** Manifest V3. Handles Auth Sync, "Send" Logic, Auto-Launch Logic, and Status Toggles.  
* **Backend:** Node.js WebSocket Server. Enforces Server-Side Filtering (Echo Cancellation).

## **2\. Functional Requirements (FR)**

### **FR-01: Main Web App (The "Receiver")**

* **FR-01.1 (Auto-Unlock):** On load, display a blocking "Click to Connect" overlay to guarantee AudioContext is unlocked.  
* **FR-01.2 (Idle Detection):** Use IdleDetector API. Logic Flow:  
  1. If no mouse movement for **10 minutes** \-\> Trigger Warning State.  
  2. Send signal to Extension to show toast: "Are you still there?"  
  3. If no response in **60s** \-\> Auto-switch status to **AFK**.  
* **FR-01.3 (Device Management):** Listen for navigator.mediaDevices.ondevicechange. Auto-switch output to new system default.  
* **FR-01.4 (Keep-Alive):** Maintain a 30-second Ping/Pong heartbeat with the server to prevent background tab throttling.

### **FR-02: Chrome Extension (The "Sender")**

* **FR-02.1 (Auto-Launch Logic):**  
  * On click, Background Script queries open tabs for app.instacom.com.  
  * **If Missing:** Create new **pinned** tab with Web App URL.  
  * **Wait State:** Extension must wait for a "Ready/Connected" signal from the new tab before allowing the user to record.  
* **FR-02.2 (Tile Grid UI):**  
  * **Grid:** Member Tiles (Avatar \+ Name \+ Status).  
  * **Visual Busy Indicator:** If User A is speaking, their tile pulses Yellow.  
* **FR-02.3 (Mini-Player):** Footer contains a Play/Pause button for the *most recent* incoming message.  
* **FR-02.4 (Update Badge):** Check manifest.json against server version. Show "Update Required" icon if mismatched.

### **FR-03: Audio Logic & Routing**

* **FR-03.1 (Server-Side Filtering):** Server **must** filter the stream distribution list.  
  * BroadcastList \= GroupMembers \- SenderID.  
* **FR-03.2 (Time Constraints):**  
  * **Spam Protection:** Discard any recording \< **300ms**.  
  * **Stuck Mic Protection:** Force stop recording at **3 Minutes**.  
* **FR-03.3 (Jitter Buffer):** Receiver implements a \~200ms buffer to smooth packet arrival variance.

### **FR-04: User Status & Modes**

* **FR-04.1 (Active \- Green):** Plays audio live.  
* **FR-04.2 (AFK \- Red):** Suppresses live audio. Saves to history. Queues Notification.  
* **FR-04.3 (Do Not Disturb \- Yellow):** Suppresses live audio. Saves to history. **Suppress Notifications.**  
* **FR-04.4 (Offline):** Treated as AFK.

### **FR-05: History & Privacy**

* **FR-05.1 (Unified History):**  
  * Server retains last **10 Group Messages**.  
  * Server retains last **5 Direct Messages** (per pair).  
  * Syncs to client on login.  
* **FR-05.2 (Admin Audit):** Admins can listen to 1-to-1 DMs, but the system generates a visible log entry: *"Admin \[Name\] accessed conversation \[ID\] on \[Date\]"*.

## **3\. Non-Functional Requirements (NFR)**

* **Performance:** Extension Popup load time \< 200ms.  
* **Reliability:** "Keep-Alive" system must maintain connection in background tabs for at least 8 hours.  
* **Security:** Auth tokens synchronized from Web App cookies; never stored in insecure localStorage within the extension.