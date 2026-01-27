import { FastifyInstance, FastifyRequest } from 'fastify';
import { authenticate } from '../middleware/auth.middleware';

export const voiceRoutes = async (fastify: FastifyInstance) => {
    // Add auth middleware to all routes
    fastify.addHook('preHandler', authenticate);

    // GET /voice-messages/history - Get voice message history
    fastify.get('/voice-messages/history', async (request: FastifyRequest<{
        Querystring: { type?: 'group' | 'direct' }
    }>, reply) => {
        const { type } = request.query;
        const user = (request as any).user;

        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        try {
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();

            // Build query based on type
            const where: any = {};

            if (type === 'group') {
                where.groupId = user.groupId;
            } else if (type === 'direct') {
                where.OR = [
                    { senderId: user.userId },
                    { recipientId: user.userId }
                ];
            } else {
                // Get both group and direct messages
                where.OR = [
                    { groupId: user.groupId },
                    { senderId: user.userId },
                    { recipientId: user.userId }
                ];
            }

            const messages = await prisma.voiceMessage.findMany({
                where,
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: type === 'direct' ? 5 : 10 // Limit based on type
            });

            await prisma.$disconnect();

            return messages;
        } catch (err) {
            fastify.log.error({ err }, 'Failed to fetch voice message history');
            return reply.code(500).send({ error: 'Failed to fetch history' });
        }
    });

    // GET /voice-messages/pending - Get unplayed messages
    fastify.get('/voice-messages/pending', async (request, reply) => {
        const user = (request as any).user;

        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        try {
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();

            const messages = await prisma.voiceMessage.findMany({
                where: {
                    OR: [
                        { recipientId: user.userId, isPlayed: false },
                        { groupId: user.groupId, isPlayed: false }
                    ]
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            await prisma.$disconnect();

            return messages;
        } catch (err) {
            fastify.log.error({ err }, 'Failed to fetch pending messages');
            return reply.code(500).send({ error: 'Failed to fetch pending messages' });
        }
    });

    // POST /voice-messages/:id/played - Mark message as played
    fastify.post('/voice-messages/:id/played', async (request: FastifyRequest<{
        Params: { id: string }
    }>, reply) => {
        const { id } = request.params;
        const user = (request as any).user;

        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        try {
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();

            await prisma.voiceMessage.update({
                where: { id },
                data: { isPlayed: true }
            });

            await prisma.$disconnect();

            return { success: true };
        } catch (err) {
            fastify.log.error({ err }, 'Failed to mark message as played');
            return reply.code(500).send({ error: 'Failed to update message' });
        }
    });
};
