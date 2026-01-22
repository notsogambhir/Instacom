# **Logic Gaps & Edge Case Analysis**

Target: InstaCom (Web App \+ Chrome Extension)  
Version: 3.0 (Resolved)  
Here are the top 20 logic gaps identified in the Web+Extension architecture, with the specific resolutions selected by the Product Owner.

## **Category A: Architecture & Browser Limitations**

### **1\. The "Receiver Down" Paradox (Critical)**

* **The Gap:** The architecture splits "Sending" (Extension) and "Receiving" (Web App). A user can send messages via Extension even if their Receiving App is closed, making them "deaf."  
* **Selected Resolution:** **Auto-Launch.**  
* **Implementation:** Upon clicking the Extension icon, the background script checks if the Web App is open. If not detected, the Extension automatically opens the Web App in a pinned background tab to ensure the receive loop is active.

### **2\. Background Tab Throttling (The "Sleep" Risk)**

* **The Gap:** Browsers throttle JS timers/WebSockets in background tabs after \~5 mins, causing delayed audio.  
* **Selected Resolution:** **Keep-Alive Ping.**  
* **Implementation:** Implement a robust "Ping/Pong" heartbeat between Server and Client every 30 seconds. This network activity generally keeps the tab execution priority higher than a completely idle tab.

### **3\. Popup Lifecycle Termination**

* **The Gap:** Extension popups die instantly when the user clicks away, cutting the audio stream mid-sentence.  
* **Selected Resolution:** **"Pin" Instruction.**  
* **Implementation:** The UI will actively advise heavy users to "Pin" the extension sidebar (where supported) or instruct them that clicking away acts as a "Release PTT" event.

### **4\. The "Self-Echo" Loop**

* **The Gap:** User hears their own voice blast back from the Web App 300ms after speaking into the Extension.  
* **Selected Resolution:** **Server-Side Filtering.**  
* **Implementation:** The Server will check the SourceUserID of the incoming stream. When broadcasting to the group, it explicitly excludes the SourceUserID from the recipient list.

### **5\. Audio Context Autoplay Blocking**

* **The Gap:** Browser blocks audio if the user hasn't interacted with the Web App page recently (e.g., after a reload).  
* **Selected Resolution:** **(Options Expanded)**  
  1. **The "Unlock" Overlay:** A blocking modal on load that forces a "Click to Start" interaction, guaranteeing the AudioContext is unlocked.  
  2. **"Resume" Button:** If audio fails to play due to NotAllowedError, show a distinct "Resume Audio" button in the Extension or Web App that the user must click once to re-enable sound.  
  3. **Media Session API:** Hook into the browser's navigator.mediaSession metadata (usually used for music players). Setting metadata can sometimes trick the browser into treating the app as a "media player" (like Spotify), granting it more lenient autoplay privileges.

### **6\. Multi-Tab "Double Audio"**

* **The Gap:** User has the Web App open in two tabs, resulting in a phasing echo effect.  
* **Selected Resolution:** **Accepted Risk / Ignore.**  
* **Implementation:** No specific code prevention. Users are responsible for managing their open tabs.

### **7\. Auth Token Desynchronization**

* **The Gap:** Web App session expires, but Extension still tries to send audio using stale tokens.  
* **Selected Resolution:** **Persistent Session.**  
* **Implementation:** Users remain logged in through multiple sessions indefinitely until they explicitly click "Logout." The extension shares the persistent refresh\_token stored in the browser's Local Storage or Cookies.

## **Category B: User Interaction & Hardware**

### **8\. Simultaneous Broadcast Collision (The "Clamor")**

* **The Gap:** Two users speak at once.  
* **Selected Resolution:** **Visual "Busy" Indicator.**  
* **Implementation:** In the Extension UI, if someone else is currently speaking, their tile will pulse Yellow/Red. The user *can* still interrupt (audio mixing is allowed), but the visual cue warns them of the collision.

### **9\. The "False Active" Data Loss**

* **The Gap:** User leaves desk but stays "Active," missing messages.  
* **Selected Resolution:** **Idle Detection \+ Extension Toast.**  
* **Implementation:**  
  1. Use IdleDetector API to detect 10 minutes of no mouse movement.  
  2. Trigger a toast notification via the **Extension**: "Are you still there?"  
  3. If no click occurs within 60 seconds, auto-switch status to AFK.

### **10\. Mouse-Up Event Loss (Stuck Mic)**

* **The Gap:** User drags mouse off the popup and releases; app thinks PTT is still held.  
* **Selected Resolution:** **Maximum Duration Cutoff.**  
* **Implementation:** Hard limit of **3 minutes** per transmission. If a stream exceeds this, the system assumes a stuck key (or abuse) and auto-terminates the recording.

### **11\. Hardware Change on the Fly**

* **The Gap:** Audio plays to disconnected headphones instead of new speakers.  
* **Selected Resolution:** **Device Change Listener.**  
* **Implementation:** Listen for navigator.mediaDevices.ondevicechange. When triggered, the Web App will automatically re-query and switch to the new system default output.

### **12\. Rate Limiting / Spamming**

* **The Gap:** Rapid clicking creates notification spam.  
* **Selected Resolution:** **Minimum Duration.**  
* **Implementation:** Any recording shorter than **300ms** is discarded as accidental noise and not sent to the server.

## **Category C: Data & Routing Logic**

### **13\. Replay Context in Extension**

* **The Gap:** Extension has no history; user must switch apps to replay.  
* **Selected Resolution:** **"Last Message" Mini-Player.**  
* **Implementation:** The Extension footer will include a small playback control (Play/Pause) specifically for the most recent incoming message.

### **14\. 1-to-1 vs. Admin Privacy**

* **The Gap:** Trust issues regarding Admin access to private DMs.  
* **Selected Resolution:** **Admin Access Audit Log.**  
* **Implementation:** Admins can access DM logs, but every access event is logged and visible to the users involved ("Admin X accessed this log"), creating accountability.

### **15\. Offline vs. AFK Handling**

* **The Gap:** Offline users (closed browser) might lose messages intended for them.  
* **Selected Resolution:** **Unified History.**  
* **Implementation:**  
  * Closing the browser automatically marks the user as **AFK**.  
  * The server stores the last **5 messages** (for 1-to-1) and **10 messages** (for Group Broadcasts).  
  * These are synchronized to the client next time the user logs in.

### **16\. Notification "Bombardment"**

* **The Gap:** Returning to 50 separate notifications.  
* **Selected Resolution:** **Grouped Notifications.**  
* **Implementation:** If multiple messages arrive from the same source/group within a short timeframe, the previous notification is replaced or appended to (e.g., "5 New Messages in General").

### **17\. Latency vs. Storage Race Condition**

* **The Gap:** Packet loss causes audio glitches or missing history.  
* **Selected Resolution:** **Jitter Buffer.**  
* **Implementation:** Implement a client-side jitter buffer (delaying playback by \~200ms) to ensure smooth audio playback despite network variances.

### **18\. The "Ghost" Group Member**

* **The Gap:** New user blasted with audio immediately upon login.  
* **Selected Resolution:** **Accepted Risk / Ignore.**  
* **Implementation:** New users are live immediately. No "Lobby" state.

### **19\. Extension Version Mismatch**

* **The Gap:** Extension code is old, Server API is new.  
* **Selected Resolution:** **Update Badge.**  
* **Implementation:** The Extension checks the server version on load. If a mismatch exists, it displays an "Update Required" badge/icon to prompt the user to update.

### **20\. "Do Not Disturb" vs. AFK**

* **The Gap:** Need to be present but silent (e.g., in a meeting).  
* **Selected Resolution:** **DND Status Shortcut.**  
* **Implementation:**  
  * Add a **"Do Not Disturb" (Yellow)** status. Behavior: Audio is recorded to history but *not* played live. No notifications are shown.  
  * Add a shortcut in the Extension UI to quickly toggle between Active, AFK, and DND.