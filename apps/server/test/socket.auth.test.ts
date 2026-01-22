import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { CreateSocketClient } from './utils'; // Helper we might need or just use socket.io-client directly
import { io as Client } from 'socket.io-client';
import Fastify from 'fastify';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SocketEvents, UserRole } from '@instacom/shared';
// We will mock the server setup similar to index.ts for isolation or try to import?
// Importing index.ts has side effects (starts server). 
// Better to replicate the setup in beforeAll for this test to be robust.

describe('Socket Auth Middleware', () => {
    let fastify: any;
    let io: Server;
    let address: string;

    beforeAll(async () => {
        fastify = Fastify();
        await fastify.ready();
        io = new Server(fastify.server);

        // COPY MIDDLEWARE LOGIC FROM index.ts for testing
        // Ideally we extract this to a function 'setupSocket(io)' in source
        io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication error'));
            try {
                const payload = jwt.verify(token, 'dev_secret') as any;
                socket.data.user = payload;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });

        io.on('connection', (socket) => {
            const user = socket.data.user;
            if (user.groupId) {
                socket.join(`group_${user.groupId}`);
            }
        });

        address = await fastify.listen({ port: 0, host: '127.0.0.1' });
    });

    afterAll(async () => {
        await fastify.close();
    });

    it('should reject connection without token', async () => {
        return new Promise<void>((resolve, reject) => {
            const client = Client(address, { auth: {} });
            client.on('connect_error', (err) => {
                expect(err.message).toBe('Authentication error');
                client.close();
                resolve();
            });
            client.on('connect', () => {
                client.close();
                reject(new Error('Should not connect'));
            });
        });
    });

    it('should connect with valid token', async () => {
        const token = jwt.sign({ userId: '1', role: UserRole.MEMBER, groupId: '123' }, 'dev_secret');
        return new Promise<void>((resolve, reject) => {
            const client = Client(address, { auth: { token } });
            client.on('connect', () => {
                client.close();
                resolve();
            });
            client.on('connect_error', (err) => {
                reject(err);
            });
        });
    });

    // We can't easily check server-side room joining from client without a side-channel or event.
    // But we can check if we receive messages sent to that room? 
    // Wait, the client doesn't receive messages unless *someone* sends one. 
});
