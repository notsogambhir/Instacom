import { useEffect, useRef, useState } from 'react';
import { SocketEvents } from '@instacom/shared';
import { useAuth } from '../context/AuthContext';
import { AudioProcessor } from '../audio/AudioProcessor';
import { AudioPlayer } from '../audio/AudioPlayer';

// Declare global io from CDN
declare global {
    interface Window {
        io: any;
    }
}

export type TargetSelection = {
    type: 'BROADCAST' | 'DIRECT';
    userId?: string;
};

export const useAudioSession = () => {
    const { accessToken, user } = useAuth();
    const [isOnline, setIsOnline] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [target, setTarget] = useState<TargetSelection>({ type: 'BROADCAST' });
    const socketRef = useRef<any>(null);
    const audioProcessorRef = useRef<AudioProcessor | null>(null);
    const audioPlayerRef = useRef<AudioPlayer | null>(null);
    const currentMessageIdRef = useRef<string | null>(null);

    // Initialize Socket and Audio on "Go Online"
    const goOnline = async () => {
        if (!accessToken) return;
        if (socketRef.current) return;
        if (!window.io) {
            console.error('Socket.io not loaded from CDN');
            return;
        }

        try {
            // 1. Initialize Audio Context (requires user gesture)
            const processor = new AudioProcessor();
            await processor.initialize();
            audioProcessorRef.current = processor;

            // 2. Initialize Audio Player for playback
            const player = new AudioPlayer();
            await player.initialize();
            audioPlayerRef.current = player;

            // 3. Connect Socket with Token
            const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
            const socket = window.io(WS_URL, {
                auth: { token: accessToken },
                transports: ['websocket', 'polling']
            });

            socket.on('connect', () => {
                console.log('Socket connected - My ID:', socket.id);
                setIsOnline(true);
            });

            socket.on('connect_error', (err: any) => {
                console.error('Socket error:', err);
                setIsOnline(false);
            });

            // Listen for message ID after starting a stream
            socket.on(SocketEvents.MESSAGE_ID, (messageId: string) => {
                currentMessageIdRef.current = messageId;
                console.log(`📤  Got message ID: ${messageId}`);
            });

            // Handle incoming audio from other users
            socket.on(SocketEvents.VOICE_STREAM, (chunk: Float32Array, senderId: string) => {
                console.log(`📥 Received audio chunk from ${senderId} (${chunk.length} samples)`);
                console.log(`   My socket ID: ${socket.id} | Sender ID: ${senderId}`);
                // Don't play back our own audio (echo prevention)
                if (senderId !== socket.id && audioPlayerRef.current) {
                    console.log(`🔊 Queueing audio for playback`);
                    audioPlayerRef.current.queueAudio(chunk, senderId);
                } else {
                    console.log(`⏭️ Skipping own audio (IDs match - echo prevention)`);
                }
            });

            socketRef.current = socket;
        } catch (err) {
            console.error('Failed to go online', err);
        }
    };

    const goOffline = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        if (audioProcessorRef.current) {
            audioProcessorRef.current.close();
            audioProcessorRef.current = null;
        }

        if (audioPlayerRef.current) {
            audioPlayerRef.current.close();
            audioPlayerRef.current = null;
        }

        setIsOnline(false);
        setIsBroadcasting(false);
    };

    const startBroadcasting = () => {
        if (!isOnline || !audioProcessorRef.current || !socketRef.current) return;

        // Start a new voice message
        const metadata = target.type === 'BROADCAST'
            ? { groupId: user?.groupId }
            : { recipientId: target.userId };

        socketRef.current.emit(SocketEvents.VOICE_STREAM_START, metadata);

        // Wait for message ID, then start capturing
        const checkMessageId = setInterval(() => {
            if (currentMessageIdRef.current) {
                clearInterval(checkMessageId);
                setIsBroadcasting(true);

                audioProcessorRef.current!.startCapture((chunk: Float32Array) => {
                    socketRef.current?.emit(
                        SocketEvents.VOICE_STREAM,
                        chunk,
                        currentMessageIdRef.current
                    );
                });
            }
        }, 50);

        // Timeout after 3 seconds
        setTimeout(() => clearInterval(checkMessageId), 3000);
    };

    const stopBroadcasting = () => {
        if (!isOnline || !audioProcessorRef.current) return;

        setIsBroadcasting(false);
        audioProcessorRef.current.stopCapture();

        // End the voice message
        if (currentMessageIdRef.current && socketRef.current) {
            socketRef.current.emit(SocketEvents.VOICE_STREAM_END, currentMessageIdRef.current);
            currentMessageIdRef.current = null;
        }
    };

    const selectTarget = (newTarget: TargetSelection) => {
        setTarget(newTarget);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            goOffline();
        };
    }, []);

    return {
        isOnline,
        isBroadcasting,
        target,
        goOnline,
        goOffline,
        startBroadcasting,
        stopBroadcasting,
        selectTarget
    };
};
