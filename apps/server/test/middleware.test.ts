import { describe, it, expect, vi } from 'vitest';
import { authenticate, requireRole } from '../src/middleware/auth.middleware';
import { UserRole } from '@instacom/shared';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
    describe('authenticate', () => {
        it('should return 401 if no header', async () => {
            const req: any = { headers: {} };
            const reply: any = { code: vi.fn().mockReturnThis(), send: vi.fn() };
            await authenticate(req, reply);
            expect(reply.code).toHaveBeenCalledWith(401);
            expect(reply.send).toHaveBeenCalledWith({ message: 'Missing or invalid token' });
        });

        it('should populate user if valid token', async () => {
            const token = jwt.sign({ userId: '1', role: UserRole.MEMBER }, 'dev_secret');
            const req: any = { headers: { authorization: `Bearer ${token}` } };
            const reply: any = { code: vi.fn().mockReturnThis(), send: vi.fn() };
            await authenticate(req, reply);
            expect(req.user).toBeDefined();
            expect(req.user.userId).toBe('1');
        });
    });

    describe('requireRole', () => {
        it('should 403 if role mismatch', async () => {
            const req: any = { user: { role: UserRole.MEMBER } };
            const reply: any = { code: vi.fn().mockReturnThis(), send: vi.fn() };
            const middleware = requireRole([UserRole.SUPER_ADMIN]);
            await middleware(req, reply);
            expect(reply.code).toHaveBeenCalledWith(403);
        });

        it('should pass if role matches', async () => {
            const req: any = { user: { role: UserRole.SUPER_ADMIN } };
            const reply: any = { code: vi.fn().mockReturnThis(), send: vi.fn() };
            const middleware = requireRole([UserRole.SUPER_ADMIN]);
            await middleware(req, reply);
            expect(reply.code).not.toHaveBeenCalled();
        });
    });
});
