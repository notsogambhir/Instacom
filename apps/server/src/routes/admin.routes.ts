import { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '@instacom/shared';
import { prisma } from '../lib/db';
import * as argon2 from 'argon2';

export const adminRoutes = async (fastify: FastifyInstance) => {
    // List members in user's group
    fastify.get('/members', {
        onRequest: [authenticate, requireRole([UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN])]
    }, async (request, reply) => {
        const user = request.user!;

        const where = user.role === UserRole.SUPER_ADMIN
            ? {} // Super admin sees all
            : { groupId: user.groupId }; // Group admin sees only their group

        const members = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                isActive: true,
                lastSeenAt: true,
                groupId: true,
                group: {
                    select: {
                        name: true,
                        groupCode: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        return members;
    });

    // Suspend user
    fastify.put('/members/:id/suspend', {
        onRequest: [authenticate, requireRole([UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN])]
    }, async (request, reply) => {
        const { id } = request.params as any;

        await prisma.user.update({
            where: { id },
            data: { isActive: false }
        });

        // TODO: Revoke refresh tokens

        return { success: true };
    });

    // Restore user
    fastify.put('/members/:id/restore', {
        onRequest: [authenticate, requireRole([UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN])]
    }, async (request, reply) => {
        const { id } = request.params as any;

        await prisma.user.update({
            where: { id },
            data: { isActive: true }
        });

        return { success: true };
    });

    // Create new group (Super Admin only)
    fastify.post('/groups', {
        onRequest: [authenticate, requireRole([UserRole.SUPER_ADMIN])]
    }, async (request, reply) => {
        const { name, groupCode, maxSeats, adminEmail, adminPassword } = request.body as any;

        // Create group and initial admin in transaction
        const result = await prisma.$transaction(async (tx) => {
            const group = await tx.group.create({
                data: {
                    name,
                    groupCode: groupCode || name.toUpperCase().replace(/\s/g, '_'),
                    maxSeats: maxSeats || 10
                }
            });

            const passwordHash = await argon2.hash(adminPassword);

            const admin = await tx.user.create({
                data: {
                    email: adminEmail,
                    name: `${name} Admin`,
                    passwordHash,
                    role: UserRole.GROUP_ADMIN,
                    groupId: group.id,
                    isActive: true
                }
            });

            return { group, admin };
        });

        return result;
    });

    // List all groups (Super Admin only)
    fastify.get('/groups', {
        onRequest: [authenticate, requireRole([UserRole.SUPER_ADMIN])]
    }, async (request, reply) => {
        const groups = await prisma.group.findMany({
            include: {
                _count: {
                    select: { members: true }
                }
            }
        });

        return groups;
    });
};
