import { describe, it, expect, vi } from 'vitest';
import { AudioProcessor } from './AudioProcessor';

// Mock local rnnoise stub
vi.mock('../lib/rnnoise', () => {
    return {
        createRnnoiseProcessor: vi.fn().mockResolvedValue({
            process: vi.fn((input) => input), // Pass through for test
            destroy: vi.fn(),
        }),
    };
});

describe('AudioProcessor', () => {
    it('should initialize successfully', async () => {
        const processor = new AudioProcessor();
        await processor.init();
        expect(processor.isReady).toBe(true);
    });

    it('should process audio buffer', async () => {
        const processor = new AudioProcessor();
        await processor.init();
        const input = new Float32Array(480); // 10ms at 48kHz
        const output = await processor.process(input);
        expect(output).toBeDefined();
        expect(output.length).toBe(480);
    });

    it('should throw error if processed before init', async () => {
        const processor = new AudioProcessor();
        await expect(processor.process(new Float32Array(480))).rejects.toThrow('AudioProcessor not initialized');
    });
});
