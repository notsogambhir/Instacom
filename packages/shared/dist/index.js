export var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["GROUP_ADMIN"] = "GROUP_ADMIN";
    UserRole["MEMBER"] = "MEMBER";
})(UserRole || (UserRole = {}));
export const SocketEvents = {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    JOIN_ROOM: 'join-room',
    VOICE_STREAM: 'voice-stream',
    VOICE_STREAM_START: 'voice-stream-start',
    VOICE_STREAM_END: 'voice-stream-end',
    MESSAGE_ID: 'message-id',
    USER_STATUS_CHANGED: 'user-status-changed'
};
