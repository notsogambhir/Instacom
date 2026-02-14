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

        // Resume audio context if suspended (Chrome requires user interaction)
        if (this.audioContext.state === 'suspended') {
            console.log('⚠️ AudioContext suspended, attempting to resume...');
            this.audioContext.resume().then(() => {
                console.log('✅ AudioContext resumed successfully');
            }).catch(err => {
                console.error('❌ Failed to resume AudioContext:', err);
            });
        }

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
     * Uses scheduled playback to create continuous audio without gaps
     */
    private async startStreamPlayback(userId: string) {
        const stream = this.streams.get(userId);
        if (!stream || !this.audioContext) return;

        // Prevent multiple playback loops for the same stream
        if (stream.isPlaying) return;

        stream.isPlaying = true;

        // Track the next scheduled playback time for gapless audio
        let nextPlayTime = this.audioContext.currentTime;

        // Continuously process queue chunks
        const processQueue = () => {
            // Process all available chunks in queue
            while (stream.queue.length > 0) {
                const chunk = stream.queue.shift();
                if (!chunk) break;

                // Validate chunk has data
                if (!chunk.length || chunk.length === 0) {
                    console.warn(`⚠️ Skipping empty audio chunk (length: ${chunk.length})`);
                    continue;
                }

                // Create audio buffer from Float32Array
                const audioBuffer = this.audioContext!.createBuffer(
                    1, // mono
                    chunk.length,
                    this.audioContext!.sampleRate
                );
                audioBuffer.getChannelData(0).set(chunk);

                // Create source and connect to this stream's gain node
                const source = this.audioContext!.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(stream.gainNode);

                // Schedule playback at the precise next time to create gapless audio
                // If we're behind schedule, play immediately
                const playTime = Math.max(nextPlayTime, this.audioContext!.currentTime);
                source.start(playTime);

                // Calculate when this chunk will finish
                const chunkDuration = chunk.length / this.audioContext!.sampleRate;
                nextPlayTime = playTime + chunkDuration;
            }

            // Check if more chunks might be coming
            if (stream.isPlaying) {
                // Schedule next check for new chunks
                setTimeout(processQueue, 50); // Check every 50ms for new chunks
            }
        };

        // Start processing queue
        processQueue();

        // Monitor and stop when stream is inactive
        const monitorActivity = () => {
            // Check if stream still has pending audio or new chunks
            const hasActivity = stream.queue.length > 0 ||
                nextPlayTime > this.audioContext!.currentTime;

            if (!hasActivity) {
                // No activity - stop the stream
                stream.isPlaying = false;
                console.log(`✅ Stream playback ended for user: ${userId}`);

                // Clean up after delay
                setTimeout(() => {
                    if (stream.queue.length === 0 && !stream.isPlaying) {
                        console.log(`🧹 Cleaning up stream for user: ${userId}`);
                        stream.gainNode.disconnect();
                        this.streams.delete(userId);
                        this.updateGainLevels();
                    }
                }, 5000); // 5 second grace period
            } else {
                // Still active - check again later
                setTimeout(monitorActivity, 500);
            }
        };

        // Start monitoring
        setTimeout(monitorActivity, 500);
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
