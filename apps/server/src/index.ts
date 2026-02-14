import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './lib/prisma';
import { SocketEvents, type AuthPayload } from '@instacom/shared';
import { authRoutes } from './routes/auth.routes';

const fastify = Fastify({ logger: true });

const start = async () => {
    try {
        // Register CORS first - CRITICAL for preflight requests
        await fastify.register(cors, {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        });

        await fastify.register(cookie as any);
        await fastify.register(authRoutes);

        // Register status routes (requires auth)
        const { statusRoutes } = await import('./routes/status.routes');
        await fastify.register(statusRoutes);

        // Register admin routes (requires admin auth)
        const { adminRoutes } = await import('./routes/admin.routes');
        await fastify.register(adminRoutes, { prefix: '/admin' });

        // Register voice message routes (requires auth)
        const { voiceRoutes } = await import('./routes/voice.routes');
        await fastify.register(voiceRoutes);

        // Setup Socket.io
        const io = new Server(fastify.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            transports: ['websocket', 'polling']
        });

        // Socket Auth Middleware
        io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            try {
                const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret') as AuthPayload;
                socket.data.user = payload;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });

        // Track active voice messages
        const activeMessages = new Map<string, {
            chunks: Float32Array[];
            startTime: number;
            metadata: any;
        }>();

        io.on('connection', async (socket) => {
            const user = socket.data.user as AuthPayload;
            fastify.log.info(`Client connected: ${socket.id} (${user.email})`);

            // Update user status to ACTIVE
            try {
                await prisma.user.update({
                    where: { id: user.userId },
                    data: { status: 'ACTIVE', lastSeenAt: new Date() }
                });
            } catch (err) {
                fastify.log.error({ err }, 'Failed to update user status');
            }

            // Join Group Room
            if (user.groupId) {
                const roomId = `group_${user.groupId}`;
                socket.join(roomId);
                fastify.log.info(`Socket ${socket.id} auto-joined ${roomId}`);
            }

            socket.on('disconnect', async () => {
                fastify.log.info(`Client disconnected: ${socket.id}`);

                // Update status to OFFLINE
                try {
                    await prisma.user.update({
                        where: { id: user.userId },
                        data: { status: 'OFFLINE', lastSeenAt: new Date() }
                    });
                } catch (err) {
                    fastify.log.error({ err }, 'Failed to update user status on disconnect');
                }
            });

            // VOICE_STREAM_START - Initialize new message
            socket.on(SocketEvents.VOICE_STREAM_START, (metadata: { groupId?: string; recipientId?: string }) => {
                const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                activeMessages.set(messageId, {
                    chunks: [],
                    startTime: Date.now(),
                    metadata: { ...metadata, senderId: user.userId }
                });
                socket.emit(SocketEvents.MESSAGE_ID, messageId);
                fastify.log.info(`Voice stream started: ${messageId}`);
            });

            // VOICE_STREAM - Receive audio chunk
            socket.on(SocketEvents.VOICE_STREAM, async (chunk: Float32Array, messageId: string) => {
                const message = activeMessages.get(messageId);
                if (!message) {
                    fastify.log.warn(`Received chunk for unknown message: ${messageId}`);
                    return;
                }

                // Store chunk
                message.chunks.push(chunk);

                // Get recipients
                const { getRecipients } = await import('./services/voice.service');
                const recipients = await getRecipients(message.metadata);

                // Live stream to ACTIVE users only (excluding sender to prevent echo)
                const activeUsers = recipients.filter((u: any) =>
                    u.status === 'ACTIVE' && u.id !== message.metadata.senderId
                );

                for (const recipient of activeUsers) {
                    // Find their socket ID (simplified - in production use a socket-user map)
                    const targetSocketId = Array.from(io.sockets.sockets.values())
                        .find(s => (s.data.user as AuthPayload)?.userId === recipient.id)?.id;

                    if (targetSocketId) {
                        io.to(targetSocketId).emit(SocketEvents.VOICE_STREAM, chunk, socket.id);
                    }
                }
            });

            // VOICE_STREAM_END - Finalize and store message
            socket.on(SocketEvents.VOICE_STREAM_END, async (messageId: string) => {
                const message = activeMessages.get(messageId);
                if (!message) {
                    fastify.log.warn(`Received end for unknown message: ${messageId}`);
                    return;
                }

                try {
                    // Combine chunks
                    const { combineAudioChunks, uploadVoiceMessage } = await import('./services/storage.service');
                    const audioBuffer = combineAudioChunks(message.chunks);

                    // Upload to storage
                    const audioUrl = await uploadVoiceMessage(audioBuffer, message.metadata);

                    // Calculate duration
                    const duration = Math.floor((Date.now() - message.startTime) / 1000);

                    // Save to database
                    await prisma.voiceMessage.create({
                        data: {
                            senderId: message.metadata.senderId,
                            recipientId: message.metadata.recipientId,
                            groupId: message.metadata.groupId,
                            audioUrl,
                            duration,
                            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                        }
                    });

                    // Cleanup old messages
                    const { cleanupOldMessages } = await import('./services/voice.service');
                    await cleanupOldMessages(message.metadata);

                    fastify.log.info(`Voice message saved: ${messageId} (${duration}s)`);
                } catch (err) {
                    fastify.log.error({ err }, 'Failed to save voice message');
                } finally {
                    activeMessages.delete(messageId);
                }
            });
        });

        console.log('Starting server...');
        await fastify.ready();
        console.log('Fastify ready.');
        console.log('Socket.io attached.');

        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server listening on port 3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
