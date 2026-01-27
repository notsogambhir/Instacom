export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    GROUP_ADMIN = "GROUP_ADMIN",
    MEMBER = "MEMBER"
}
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    groupId?: string;
    status: 'online' | 'busy' | 'offline';
}
export interface AuthPayload {
    userId: string;
    email: string;
    role: UserRole;
    groupId?: string;
    name?: string;
}
export interface LoginResponse {
    token: string;
    user: User;
}
export interface LoginRequest {
    email: string;
    pass: string;
}
export declare const SocketEvents: {
    readonly CONNECTION: "connection";
    readonly DISCONNECT: "disconnect";
    readonly JOIN_ROOM: "join-room";
    readonly VOICE_STREAM: "voice-stream";
    readonly VOICE_STREAM_START: "voice-stream-start";
    readonly VOICE_STREAM_END: "voice-stream-end";
    readonly MESSAGE_ID: "message-id";
    readonly USER_STATUS_CHANGED: "user-status-changed";
};
export type SocketEventType = typeof SocketEvents[keyof typeof SocketEvents];
