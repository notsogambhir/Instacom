# **Product Requirements Document (PRD)**

| Project Name | InstaCom (Working Title) |
| :---- | :---- |
| **Version** | 0.3 (Logic Updates) |
| **Status** | In Progress |
| **Product Manager** | Gemini (AI Assistant) |
| **Last Updated** | January 16, 2026 |

## **1\. Executive Summary**

**InstaCom** is a web-based group intercom application designed for immediate, friction-free voice communication. Unlike standard calling apps, InstaCom delivers audio instantly to active users ("Walkie-Talkie style") while seamlessly falling back to voice notes for inactive/offline users. It supports simultaneous speaking (mixing), persistent history, and 1-to-1 channels.

## **2\. Problem Statement**

* **Current State:** Teams rely on slow text or high-friction calls.  
* **Ideal State:** Instant voice communication. Users press a key to speak, allowing for fluid overlap and quick coordination, with a safety net for those away from their desks.

## **3\. Target Audience (Personas)**

* **Primary:** **Ops Managers/Teams** requiring high-frequency, low-latency coordination.  
* **Secondary:** **Casual Groups/Gamers** wanting a lightweight alternative to Discord voice channels.

## **4\. User Stories & Features**

### **Phase 1 (MVP)**

| ID | Feature Name | User Story | Priority |
| :---- | :---- | :---- | :---- |
| **F-01** | **Mixed Audio Broadcast** | As a member, I want to talk even if someone else is talking, so we can have quick, overlapping interactions (like a real room). | **P0** |
| **F-02** | **Smart Routing & Storage** | As a system, I want to stream audio to Active users AND save it to the database simultaneously, ensuring no message is ever lost due to network glitches. | **P0** |
| **F-03** | **Sticky Target Selector** | As a user, if I select "John" to talk 1-to-1, I want the selection to stay on "John" until I change it, so I don't accidentally broadcast to the group. | **P0** |
| **F-04** | **History & Replay** | As a member, I want to see a list of the last 10 Group and 5 Direct messages to replay them at will. | **P1** |
| **F-05** | **Invite System** | As a new user added by an Admin, I want to "Accept Invite" before joining the audio stream, preventing sudden noise blasts. | **P1** |
| **F-06** | **Grouped Notifications** | As an AFK user, I want my missed messages to be grouped (e.g., "5 new messages from Group"), rather than receiving 5 separate popups. | **P2** |
| **F-07** | **Admin Eavesdrop** | As an Admin, I need access to all audio logs, including 1-to-1 messages, for compliance and oversight. | **P1** |

## **5\. Functional Requirements (The Logic)**

### **5.1 Authentication & Onboarding**

* **Session:** Persistent login.  
* **Invite Flow:**  
  1. Admin creates user \-\> User receives Invite Link/Email.  
  2. User logs in \-\> Sees "Pending Invite" screen.  
  3. User clicks "Accept" \-\> Enters the Audio Room.

### **5.2 Core Logic: Audio & Routing**

1. **Input:** User holds Spacebar.  
2. **Concurrency (Mixing):**  
   * The system **allows** multiple streams simultaneously.  
   * If User A and User B talk at the same time, User C hears both mixed together.  
3. **Targeting (Sticky):**  
   * Target defaults to Broadcast.  
   * If user clicks Member A, Target \= Member A.  
   * Target **persists** after key release. It only changes when the user manually clicks Broadcast or another member.  
4. **Dual-Path Processing:**  
   * **Path A (Live Stream):** Sent via WebRTC/WebSocket to all Active targets.  
   * **Path B (Storage):** **ALL** audio bursts are saved to the database immediately, regardless of user status. This serves as the "History" source.

### **5.3 User Status Logic**

* **Active:** Receives live audio stream.  
* **Inactive/AFK:** Does not receive live stream. Receives notification.  
* **Offline (Logged Out):** Treated exactly as **Inactive**. Messages are stored and notification is queued for next login.  
* **Manual Toggle:** Status is changed **only** by user interaction (clicking the toggle). No auto-AFK timer.

### **5.4 Data Retention & Privacy**

* **Admin Access:** Super Admins and Group Admins have read access to the AudioCollection in the database, including files tagged as Type: Direct.  
* **Retention Limit:**  
  * Group History: Show last 10 messages in UI.  
  * Direct History: Show last 5 messages in UI.  
  * (Backend may store more based on retention policy, but UI is limited).

## **6\. User Experience (UX/UI) Flow**

1. **Dashboard Layout:**  
   * **Sidebar:** Member list. Clicking a name locks PTT to that user. Highlighted name indicates current target.  
   * **Center:** Visualizer/PTT Button.  
   * **Right Panel (History):**  
     * Tab 1: **Group** (List of last 10 playable clips).  
     * Tab 2: **Direct** (List of last 5 playable clips).  
2. **Notification State (AFK):**  
   * When returning from AFK, user sees a "Summary Badge" (e.g., "7 Missed Messages").  
   * Clicking the badge opens the History Panel.

## **7\. Non-Functional Requirements**

* **Audio Mixing:** Client-side mixing (Web Audio API) preferred to reduce server load, unless MCU (Multipoint Control Unit) is used.  
* **Latency:** \<300ms for live stream.  
* **Storage:** Audio stored in compressed format (Opus/WebM) to save space.

## **8\. Risks & Mitigation**

| Risk | Mitigation Strategy |
| :---- | :---- |
| **"Hot Mic" on Private Channel** | User forgets they are locked to "John" and thinks they are broadcasting. **Mitigation:** Distinct UI color coding (e.g., Blue for Group, Purple for Direct). |
| **Browser Key Stuck** | User tabs out while holding space, keeping mic open. **Mitigation:** Accepted risk for MVP (per user decision). |
| **Chaos** | Too many people talking at once. **Mitigation:** UI shows "Who is talking" indicators so users can self-moderate. |

## **9\. Open Questions**

* None. (All logic gaps from v0.2 resolved).