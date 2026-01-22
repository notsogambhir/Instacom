# **Business Requirements Document (BRD)**

Project: InstaCom (Web \+ Extension)  
Version: 3.1 (Aligned with Process Maps)  
Date: January 19, 2026

## **1\. Business Case**

### **1.1 Executive Summary**

InstaCom is a browser-based intercom system consisting of a **Main Web Application** and a companion **Chrome Extension**. It bridges the gap between formal meetings and text chat by providing a "Speed Dial" interface in the browser toolbar. The system solves the "Availability Paradox" of web apps by using the extension to auto-launch the receiver if it's closed, ensuring messages are never missed.

### **1.2 Strategic Alignment**

* **Availability Assurance:** Solves the critical flaw of web-based comms (closing the tab) via an extension-driven "Auto-Launch" mechanism.  
* **Workflow Integration:** Integrates directly into the user's primary workspace (the browser), removing the need to manage a separate OS window.  
* **Privacy & Trust:** Implements Admin Audit Logs and "Do Not Disturb" modes to balance operational speed with employee privacy.

### **1.3 Scope**

* **In-Scope:**  
  * **Main Web App (PWA):** React-based dashboard for receiving audio, history playback, admin controls, and "Always-on" listening.  
  * **Chrome Extension (MV3):** Popup interface with Tile Grid for sending audio, checking status, and quick-toggling DND.  
  * **Backend:** Node.js/WebSocket signaling, Blob Storage for history, PostgreSQL for user data.  
* **Out-of-Scope:** Standalone Desktop Apps, Mobile Apps (Phase 1), Video Calling.

## **2\. Gap Analysis & Resolutions**

This section outlines the critical logic gaps identified during the design phase and their selected technical resolutions.

| Gap Area | Problem | Selected Resolution |
| :---- | :---- | :---- |
| **Receiver Down** | If a user closes the web tab, they become "deaf" to incoming messages. | **Auto-Launch:** Extension detects closed tab and opens it (pinned) automatically. |
| **Throttling** | Background tabs lose WebSocket priority (sleep mode). | **Keep-Alive:** 30s Ping/Pong heartbeat \+ Client-Side Jitter Buffer. |
| **Self-Echo** | User hears their own voice played back 300ms later. | **Server-Side Filtering:** Sender ID is explicitly excluded from the broadcast list. |
| **False Active** | User leaves desk but remains "Active". | **Idle Detection:** 10min timer \+ Toast confirmation \-\> Auto-AFK. |
| **Stuck Mic** | User drags mouse off popup, mic stays open. | **Max Duration:** Hard cutoff at 3 minutes. |
| **Privacy** | Admin snooping on 1-to-1 chats. | **Audit Logs:** Visible logs whenever an admin accesses a private file. |

## **3\. Business Goals & Metrics**

1. **Reliability:** \>99.5% successful message delivery rate (including auto-launched sessions).  
2. **Extension Adoption:** 100% of power users (Ops Managers) install the extension.  
3. **Latency:** End-to-end latency \< 500ms (including Jitter Buffer delay).  
4. **Retention:** Users average \>10 interactions per day.