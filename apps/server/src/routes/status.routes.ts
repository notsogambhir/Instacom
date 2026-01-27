import { FastifyInstance, FastifyRequest } from 'fastify';
import { authenticate } from '../middleware/auth.middleware';

export const statusRoutes = async (fastify: FastifyInstance) => {
    // Add auth middleware to all routes
    fastify.addHook('preHandler', authenticate);

    // POST /user/status - Update user status
    fastify.post('/user/status', async (request: FastifyRequest<{
        Body: { status: string }
    }>, reply) => {
        const { status } = request.body;
        const user = (request as any).user;

        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        try {
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();

            await prisma.user.update({
                where: { id: user.userId },
                data: { status, lastSeenAt: new Date() }
            });

            await prisma.$disconnect();

            return { success: true, status };
        } catch (err) {
            fastify.log.error({ err }, 'Failed to update user status');
            return reply.code(500).send({ error: 'Failed to update status' });
        }
    });

    // GET /groups/:groupId/members - Get all members in a group
    fastify.get('/groups/:groupId/members', async (request: FastifyRequest<{
        Params: { groupId: string }
    }>, reply) => {
        const { groupId } = request.params;
        const user = (request as any).user;

        if (!user || user.groupId !== groupId) {
            return reply.code(403).send({ error: 'Forbidden' });
        }

        try {
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();

            const members = await prisma.user.findMany({
                where: { groupId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    status: true
                }
            });

            await prisma.$disconnect();

            return members;
        } catch (err) {
            fastify.log.error({ err }, 'Failed to fetch group members');
            return reply.code(500).send({ error: 'Failed to fetch members' });
        }
    });
};
