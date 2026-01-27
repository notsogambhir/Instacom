export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    GROUP_ADMIN = 'GROUP_ADMIN',
    MEMBER = 'MEMBER'
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

export const SocketEvents = {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    JOIN_ROOM: 'join-room',
    VOICE_STREAM: 'voice-stream',
    VOICE_STREAM_START: 'voice-stream-start',
    VOICE_STREAM_END: 'voice-stream-end',
    MESSAGE_ID: 'message-id',
    USER_STATUS_CHANGED: 'user-status-changed'
} as const;

export type SocketEventType = typeof SocketEvents[keyof typeof SocketEvents];
