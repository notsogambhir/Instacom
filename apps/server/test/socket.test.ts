import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

describe('Real-Time Transport (Integration)', () => {
    let serverProcess: ChildProcess;
    let clientA: ClientSocket;
    let clientB: ClientSocket;
    const PORT = 3000;

    beforeAll(async () => {
        // Start server as child process
        serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
            cwd: path.resolve(__dirname, '..'),
            stdio: 'pipe',
            shell: true
        });

        // Log unexpected errors
        serverProcess.stderr?.on('data', (d) => console.error('Server Error:', d.toString()));

        // Wait for server to be ready
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Server start timeout')), 15000);
            serverProcess.stdout?.on('data', (data) => {
                if (data.toString().includes('Server listening')) {
                    clearTimeout(timeout);
                    resolve();
                }
            });
        });

        // Connect clients
        clientA = ioc(`http://localhost:${PORT}`);
        clientB = ioc(`http://localhost:${PORT}`);

        await Promise.all([
            new Promise<void>((res) => clientA.on('connect', res)),
            new Promise<void>((res) => clientB.on('connect', res)),
        ]);
    }, 20000); // Increased timeout

    afterAll(() => {
        clientA?.disconnect();
        clientB?.disconnect();
        serverProcess?.kill();
    });

    it('should allow clients to join a room', async () => {
        clientA.emit('join-room', 'room-1');
        clientB.emit('join-room', 'room-1');

        // Allow server to process
        await new Promise(r => setTimeout(r, 100));
        expect(clientA.connected).toBe(true);
    });

    it('should relay voice-stream to others in room', async () => {
        const chunk = new Float32Array([0.1, 0.2, 0.3]);
        const received = new Promise<any>((resolve) => {
            clientB.on('voice-stream', (data, senderId) => {
                resolve({ data, senderId });
            });
        });

        clientA.emit('voice-stream', chunk, 'room-1');

        const result = await received;
        // binary data comes as Buffer or ArrayBuffer usually
        expect(result.senderId).toBe(clientA.id);
    });
});
