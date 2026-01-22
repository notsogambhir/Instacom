import { describe, it, expect } from 'vitest';
import { SocketEvents, UserRole } from '@instacom/shared';
import type { User } from '@instacom/shared';

describe('Shared Package Integration', () => {
    it('should export SocketEvents', () => {
        expect(SocketEvents).toBeDefined();
        expect(SocketEvents.JOIN_ROOM).toBe('join-room');
    });

    it('should have correct type definitions', () => {
        const user: User = {
            id: '123',
            email: 'test@example.com',
            name: 'Test',
            role: UserRole.MEMBER,
            status: 'online'
        };
        expect(user.id).toBe('123');
        expect(user.role).toBe(UserRole.MEMBER);
    });
});
