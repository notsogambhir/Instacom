import { FastifyInstance } from 'fastify';
import '@fastify/cookie'; // Fix types
import { AuthService } from '../services/auth.service';
import { UserRole } from '@instacom/shared';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const authService = new AuthService();

export const authRoutes = async (fastify: FastifyInstance) => {

    // Login
    fastify.post('/auth/login', async (request, reply) => {
        const { email, pass } = request.body as any;
        try {
            const { accessToken, refreshToken, user } = await authService.login(email, pass);

            // Set HttpOnly Cookie
            reply.setCookie('refresh_token', refreshToken, {
                path: '/',
                httpOnly: true,
                secure: true, // Requires HTTPS (or localhost with secure context, often relaxed in dev)
                sameSite: 'none', // Needed for cross-site (Extension -> Webapp if different origins, but cookie is on domain)
                maxAge: 30 * 24 * 60 * 60 // 30 days
            });

            return { token: accessToken, user };
        } catch (err: any) {
            reply.code(401).send({ message: err.message });
        }
    });

    // Refresh
    fastify.post('/auth/refresh', async (request, reply) => {
        const refreshToken = request.cookies.refresh_token;
        if (!refreshToken) {
            return reply.code(401).send({ message: 'No refresh token' });
        }

        try {
            const { accessToken, user } = await authService.refresh(refreshToken);
            return { token: accessToken, user };
        } catch (err: any) {
            return reply.code(403).send({ message: err.message });
        }
    });

    // Logout
    fastify.post('/auth/logout', async (request, reply) => {
        const refreshToken = request.cookies.refresh_token;
        if (refreshToken) {
            await authService.logout(refreshToken);
        }
        reply.clearCookie('refresh_token', { path: '/' });
        return { message: 'Logged out' };
    });

    // Setup (Complete Invite)
    fastify.post('/auth/setup', async (request, reply) => {
        const { token, name, pass } = request.body as any;
        try {
            await authService.completeSetup(token, name, pass);
            return { message: 'Setup complete' };
        } catch (err: any) {
            reply.code(400).send({ message: err.message });
        }
    });

    // Admin: Invite (Protected)
    fastify.post('/admin/invite', {
        onRequest: [authenticate, requireRole([UserRole.SUPER_ADMIN, UserRole.GROUP_ADMIN])]
    }, async (request, reply) => {
        // user is now populated
        const { email, role, groupId } = request.body as any;
        // Verify creator is allowed to invite to this group (add stricter checks later)
        try {
            const token = await authService.createInvite(request.user!.userId, email, role as UserRole, groupId);
            return { link: `http://localhost:5173/setup?token=${token}` };
        } catch (err: any) {
            reply.code(500).send({ message: err.message });
        }
    });

    // Dev: Seed Super Admin
    fastify.post('/dev/seed', async (request, reply) => {
        const { email, pass } = request.body as any;
        await authService.createFirstSuperAdmin(email, pass);
        return { message: 'Seeded' };
    });
};
