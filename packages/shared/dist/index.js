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
    VOICE_STREAM: 'voice-stream'
};
