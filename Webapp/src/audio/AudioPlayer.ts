/**
 * Multi-stream audio mixer using Web Audio API
 * Supports simultaneous playback from multiple speakers with automatic volume adjustment
 */

interface SpeakerStream {
    userId: string;
    queue: Float32Array[];
    gainNode: GainNode;
    isPlaying: boolean;
}

export class AudioPlayer {
    private audioContext: AudioContext | null = null;
    private streams: Map<string, SpeakerStream> = new Map();
    private masterGainNode: GainNode | null = null;

    async initialize() {
        if (typeof window !== 'undefined') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000
            });

            // Create master gain node for overall volume control
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);
            this.masterGainNode.gain.value = 1.0;
        }
    }

    /**
     * Queue audio chunk from a specific user
     * Automatically creates a new stream if this is a new speaker
     */
    queueAudio(chunk: Float32Array, userId: string) {
        if (!this.audioContext || !this.masterGainNode) return;

        // Get or create stream for this userId
        let stream = this.streams.get(userId);
        if (!stream) {
            const gainNode = this.audioContext.createGain();
            gainNode.connect(this.masterGainNode);

            stream = {
                userId,
                queue: [],
                gainNode,
                isPlaying: false
            };
            this.streams.set(userId, stream);

            console.log(`🎙️ Created new audio stream for user: ${userId}`);
        }

        // Add chunk to stream's queue
        stream.queue.push(chunk);

        // Adjust volume based on active stream count to prevent clipping
        this.updateGainLevels();

        // Start playback for this stream if not already playing
        if (!stream.isPlaying) {
            this.startStreamPlayback(userId);
        }
    }

    /**
     * Update gain levels for all active streams
     * Uses 1/sqrt(N) rule to prevent clipping when mixing N streams
     */
    private updateGainLevels() {
        const activeCount = Array.from(this.streams.values()).filter(s => s.isPlaying || s.queue.length > 0).length;

        if (activeCount === 0) return;

        // Apply gain reduction: 1/sqrt(N) to prevent clipping
        const gain = 1.0 / Math.sqrt(activeCount);

        this.streams.forEach(stream => {
            stream.gainNode.gain.value = gain;
        });

        console.log(`🔊 Adjusted gain to ${gain.toFixed(3)} for ${activeCount} active stream(s)`);
    }

    /**
     * Start playback for a specific user's stream
     * Runs independently from other streams (concurrent playback)
     */
    private async startStreamPlayback(userId: string) {
        const stream = this.streams.get(userId);
        if (!stream || !this.audioContext) return;

        stream.isPlaying = true;

        while (stream.queue.length > 0) {
            const chunk = stream.queue.shift();
            if (!chunk) break;

            // Create audio buffer from Float32Array
            const audioBuffer = this.audioContext.createBuffer(
                1, // mono
                chunk.length,
                this.audioContext.sampleRate
            );
            audioBuffer.getChannelData(0).set(chunk);

            // Create source and connect to this stream's gain node
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(stream.gainNode);

            // Play the chunk and wait for it to finish
            await new Promise<void>((resolve) => {
                source.onended = () => resolve();
                source.start();
            });
        }

        stream.isPlaying = false;
        console.log(`✅ Stream playback ended for user: ${userId}`);

        // Clean up inactive streams after a delay
        setTimeout(() => {
            if (stream.queue.length === 0 && !stream.isPlaying) {
                console.log(`🧹 Cleaning up stream for user: ${userId}`);
                stream.gainNode.disconnect();
                this.streams.delete(userId);
                this.updateGainLevels();
            }
        }, 1000); // 1 second grace period
    }

    /**
     * Stop all active streams and clear queues
     */
    stopPlayback() {
        this.streams.forEach(stream => {
            stream.queue = [];
            stream.isPlaying = false;
            stream.gainNode.disconnect();
        });
        this.streams.clear();
        console.log('🛑 All streams stopped');
    }

    /**
     * Close audio context and cleanup resources
     */
    close() {
        this.stopPlayback();

        if (this.masterGainNode) {
            this.masterGainNode.disconnect();
            this.masterGainNode = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
