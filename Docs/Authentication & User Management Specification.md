# **Authentication & User Management Specification**

Project: InstaCom (Web \+ Extension)  
Version: 1.0  
Module: User Identity & RBAC

## **1\. Overview**

InstaCom operates on a strict **Private/Invite-Only** model. There is no public sign-up page. Access is granted via a hierarchical invitation chain to ensure security and organizational boundaries. This document defines the roles, the onboarding flow, and the technical authentication mechanisms required to sync the Web App with the Chrome Extension.

## **2\. Role-Based Access Control (RBAC) Matrix**

The system consists of three distinct privilege levels.

| Feature / Action | Super Admin (Platform Owner) | Group Admin (Team Manager) | Member (End User) |
| :---- | :---- | :---- | :---- |
| **Scope** | Global (All Groups) | Local (Own Group Only) | Self Only |
| **Create Groups** | ✅ Yes | ❌ No | ❌ No |
| **Create Group Admins** | ✅ Yes | ❌ No | ❌ No |
| **Invite Members** | ✅ Yes | ✅ Yes | ❌ No |
| **Suspend/Ban Users** | ✅ Yes | ✅ Yes | ❌ No |
| **Reset Passwords** | ✅ Yes (Any User) | ✅ Yes (Group Members) | ❌ Own Only |
| **Listen to Audio (Live)** | ❌ **No** (Privacy Firewall) | ✅ Yes | ✅ Yes |
| **Access Audit Logs** | ✅ Yes | ✅ Yes | ❌ No |
| **Billing Management** | ✅ Yes | ✅ Yes | ❌ No |

**Privacy Note:** Super Admins have system-level control but are technically restricted from accessing the audio streams or 1-to-1 history of tenant groups to maintain privacy trust.

## **3\. The Invitation & Setup Flow**

### **3.1 Flow A: Creating a New Group (Super Admin)**

1. Super Admin logs into the **Master Dashboard**.  
2. Selects "Create Tenant". Inputs: Company Name, Max Seats.  
3. Creates the **Initial Administrator** for that group.  
   * Input: Admin Email, Initial Password (or trigger invite email).

### **3.2 Flow B: Onboarding a Member (Group Admin)**

1. Group Admin logs into **Team Settings**.  
2. Clicks "Invite Member" and enters employee@company.com.  
3. **System Action:**  
   * Generates a cryptographically secure invite\_token.  
   * Sets token expiration to **48 hours**.  
   * Sends Email: *"You've been invited to \[Group Name\] on InstaCom."*  
4. **User Action:**  
   * Clicks link: https://app.instacom.com/setup?token=xyz...  
   * **Setup Screen:** System verifies token validity.  
   * User inputs: Full Name, Password.  
5. **Completion:**  
   * System creates User record.  
   * System invalidates invite\_token.  
   * User is automatically logged in and redirected to the Dashboard.

## **4\. Technical Authentication Architecture**

### **4.1 Token Strategy**

To allow the Chrome Extension to "inherit" the login from the Web App, we use a cookie-based session strategy.

* **Refresh Token:**  
  * **Storage:** HttpOnly, Secure, SameSite=None Cookie.  
  * **Domain:** .instacom.com (Main Domain).  
  * **Lifespan:** 30 Days.  
  * **Purpose:** Used to generate short-lived Access Tokens. Survives browser restarts.  
* **Access Token:**  
  * **Storage:** In-Memory (React State) & Chrome Storage (Extension).  
  * **Format:** JWT (JSON Web Token).  
  * **Lifespan:** 15 Minutes.  
  * **Payload:** { userId, groupId, role, name }.

### **4.2 Extension Synchronization Logic**

The Chrome Extension does not have its own login screen. It piggybacks on the Web App.

1. **User Login:** User logs into app.instacom.com via the browser tab. The Server sets the **HttpOnly Cookie**.  
2. **Extension Wake:** User clicks the Extension Icon.  
3. **Background Script Check:**  
   * The Extension requests permission to read cookies for https://app.instacom.com.  
   * It retrieves the refresh\_token cookie.  
4. **Token Exchange:**  
   * Extension sends the cookie to POST /api/auth/refresh.  
   * Server verifies cookie and returns a fresh **Access Token (JWT)**.  
5. **Connection:** Extension uses the JWT to establish the WebSocket connection.  
* **Failure State:** If the cookie is missing or expired, the Extension displays: *"Please log in to the Dashboard to continue"* and provides a link to open the Web App.

## **5\. Account Lifecycle Management**

### **5.1 Password Reset (Self-Service)**

1. User clicks "Forgot Password" on login screen.  
2. System sends email with reset\_token.  
3. User sets new password.  
4. **Security Action:** System revokes **ALL** existing Refresh Tokens for that user ID (logging them out of all devices/extensions).

### **5.2 Force Logout / Suspension (Admin Action)**

If an Admin clicks "Suspend User":

1. Database flag isActive is set to FALSE.  
2. **Immediate Revocation:** All Refresh Tokens associated with that userID are deleted from the Redis store/Database.  
3. **Socket Termination:** The WebSocket server checks the blacklist. If connected, the user's socket is forcibly disconnected immediately.

## **6\. Data Schema Requirements (Simplified)**

### **Table: users**

* id (UUID)  
* email (Unique)  
* password\_hash (Argon2)  
* role (Enum: SUPER\_ADMIN, GROUP\_ADMIN, MEMBER)  
* group\_id (FK)  
* is\_active (Boolean)

### **Table: invites**

* token (String, Indexed)  
* group\_id (FK)  
* email  
* expires\_at (Timestamp)  
* created\_by (FK \-\> users.id)

### **Table: audit\_logs (For Privacy Compliance)**

* id  
* actor\_id (The Admin)  
* target\_resource (e.g., "Audio File \#554")  
* action (e.g., "PLAYBACK", "DOWNLOAD")  
* timestamp