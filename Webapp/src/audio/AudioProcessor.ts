export class AudioProcessor {
    public isReady: boolean = false;
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private onDataCallback: ((chunk: Float32Array) => void) | null = null;

    async initialize() {
        if (typeof window !== 'undefined') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000 // Target 16kHz for efficiency
            });
        }
        this.isReady = true;
    }

    async init() {
        // Initialize rnnoise (stub for now - can be enhanced later)
        this.isReady = true;
    }

    async process(input: Float32Array): Promise<Float32Array> {
        // Simple pass-through for now
        // TODO: Add rnnoise processing here
        return input;
    }

    async startCapture(onData: (chunk: Float32Array) => void) {
        if (!this.audioContext) {
            throw new Error('AudioContext not initialized');
        }

        this.onDataCallback = onData;

        try {
            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true, // Browser's built-in noise suppression
                    autoGainControl: true,
                    sampleRate: 16000
                }
            });

            // Create audio source from microphone
            this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

            // Use ScriptProcessorNode for audio processing
            // Buffer size: 4096 samples (256ms at 16kHz)
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.processor.onaudioprocess = (event) => {
                const inputData = event.inputBuffer.getChannelData(0);

                // Process in 480-sample chunks (30ms frames for potential rnnoise)
                const chunkSize = 480;
                for (let i = 0; i < inputData.length; i += chunkSize) {
                    const chunk = inputData.slice(i, Math.min(i + chunkSize, inputData.length));

                    // Pad to 480 if last chunk is smaller
                    if (chunk.length < chunkSize) {
                        const padded = new Float32Array(chunkSize);
                        padded.set(chunk);
                        this.onDataCallback?.(padded);
                    } else {
                        this.onDataCallback?.(chunk);
                    }
                }
            };

            // Connect the audio graph
            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            console.log('Mic capture started');
        } catch (error) {
            console.error('Failed to access microphone:', error);
            throw error;
        }
    }

    async stopCapture() {
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }

        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        this.onDataCallback = null;
        console.log('Mic capture stopped');

        // Wait for browser to fully release the mic hardware
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    close() {
        this.stopCapture();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.isReady = false;
    }
}
