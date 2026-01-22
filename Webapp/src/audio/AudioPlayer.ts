export class AudioPlayer {
    private audioContext: AudioContext | null = null;
    private audioQueue: Float32Array[] = [];
    private isPlaying = false;
    private playbackSource: AudioBufferSourceNode | null = null;

    async initialize() {
        if (typeof window !== 'undefined') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000
            });
        }
    }

    queueAudio(chunk: Float32Array, _userId: string) {
        this.audioQueue.push(new Float32Array(chunk));

        // Start playback if not already playing and we have enough buffer
        if (!this.isPlaying && this.audioQueue.length >= 3) {
            this.startPlayback();
        }
    }

    private async startPlayback() {
        if (!this.audioContext || this.isPlaying) return;

        this.isPlaying = true;
        console.log('Audio playback started');

        const playNextChunk = () => {
            if (this.audioQueue.length === 0) {
                this.isPlaying = false;
                console.log('Audio playback stopped (buffer empty)');
                return;
            }

            const chunk = this.audioQueue.shift()!;

            // Create a buffer from the chunk
            const audioBuffer = this.audioContext!.createBuffer(1, chunk.length, this.audioContext!.sampleRate);
            audioBuffer.getChannelData(0).set(chunk);

            // Create and connect source
            const source = this.audioContext!.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext!.destination);

            // Schedule next chunk after this one finishes
            source.onended = () => {
                playNextChunk();
            };

            source.start();
            this.playbackSource = source;
        };

        playNextChunk();
    }

    stopPlayback() {
        this.isPlaying = false;
        this.audioQueue = [];

        if (this.playbackSource) {
            try {
                this.playbackSource.stop();
            } catch (e) {
                // Ignore if already stopped
            }
            this.playbackSource = null;
        }

        console.log('Audio playback stopped');
    }

    close() {
        this.stopPlayback();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
