# **User Stories & Use Case Specifications**

Project: InstaCom (Web \+ Extension)  
Version: 3.0

## **1\. User Stories (Agile)**

### **Epic: Connectivity & Availability**

* **US-1.1:** As a **User**, if I accidentally close the web app, I want the extension to automatically re-open it when I try to talk, so I'm never truly "offline."  
* **US-1.2:** As a **User**, I want the app to ask "Are you there?" before marking me AFK, so I don't miss messages just because I was reading a long document.

### **Epic: The Extension Experience**

* **US-2.1:** As a **User**, I want to see a "Mini-Player" in the extension dropdown, so I can replay the last message I missed without switching tabs.  
* **US-2.2:** As a **User**, I want to see a pulsing yellow border on a colleague's tile if they are currently talking, so I don't interrupt them.  
* **US-2.3:** As a **User**, I want to toggle "Do Not Disturb" quickly from the extension, so I can enter a meeting without getting audio blasts.

### **Epic: Privacy & Trust**

* **US-3.1:** As an **Employee**, I want to know if an Admin listens to my private 1-to-1 messages, so I can trust the platform's transparency.  
* **US-3.2:** As an **Admin**, I want to see a log of who accessed which audio files, to ensure my other admins aren't abusing their power.

## **2\. Detailed Use Cases**

### **UC-01: Send Message (With Auto-Launch)**

| Field | Details |
| :---- | :---- |
| **Actor** | User (Sender) |
| **Trigger** | User clicks Extension Icon. |
| **Flow** | 1\. **System Check:** Extension Background Script scans open tabs for app.instacom.com. 2\. **Decision:**   *If Found:* Proceed to Step 3\.   *If Missing:* Open new pinned tab with Web App. Wait for "Ready" signal. 3\. **UI Render:** Show Tile Grid. 4\. **Action:** User holds mouse on "Group Tile". 5\. **Recording:** Extension captures Mic. 6\. **Termination:** User releases mouse (or hits 3-min limit). 7\. **Routing:** Audio sent to Server. Server filters out Sender ID. Broadcasts to Active members. |

### **UC-02: Receiving in DND Mode**

| Field | Details |
| :---- | :---- |
| **Actor** | User (Recipient) in DND Status |
| **Trigger** | Incoming Audio Stream. |
| **Flow** | 1\. Web App receives stream header. 2\. Check Status: **Do Not Disturb**. 3\. **Action:**   a. Suppress Audio Playback.   b. Suppress Desktop Notification.   c. Download audio blob to "History" list.   d. Increment "Missed Messages" badge counter (Silent). |

### **UC-03: Admin Audits Private Message**

| Field | Details |
| :---- | :---- |
| **Actor** | Admin |
| **Trigger** | Admin clicks "Play" on a 1-to-1 log file. |
| **Flow** | 1\. System checks Admin Permissions. 2\. System plays audio. 3\. **System Action:** Write to Audit\_Log table: {AdminID, TargetFileID, Timestamp}. 4\. **Notification:** (Optional) Send system notification to the users involved: "Your conversation history was accessed by Admin." |

