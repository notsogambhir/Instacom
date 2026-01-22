import Fastify from 'fastify';
import { Server } from 'socket.io';
import { SocketEvents, AuthPayload } from '@instacom/shared';
import jwt from 'jsonwebtoken';

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
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

        io.on('connection', (socket) => {
            const user = socket.data.user as AuthPayload;
            fastify.log.info(`Client connected: ${socket.id} (${user.email})`);

            // Join Group Room
            if (user.groupId) {
                const roomId = `group_${user.groupId}`;
                socket.join(roomId);
                fastify.log.info(`Socket ${socket.id} auto-joined ${roomId}`);
            }

            socket.on('disconnect', () => {
                fastify.log.info(`Client disconnected: ${socket.id}`);
            });

            socket.on(SocketEvents.VOICE_STREAM, (chunk) => {
                // Only broadcast to user's group
                if (user.groupId) {
                    const roomId = `group_${user.groupId}`;
                    socket.to(roomId).emit(SocketEvents.VOICE_STREAM, chunk, socket.id);
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
