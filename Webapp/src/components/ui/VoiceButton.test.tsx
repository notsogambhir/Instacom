import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VoiceButton } from './VoiceButton';

describe('VoiceButton', () => {
    it('renders microphone icon by default', () => {
        render(
            <VoiceButton
                isRecording={false}
                onMouseDown={() => { }}
                onMouseUp={() => { }}
            />
        );
        // Lucide icons usually render as SVGs; we can look for the button
        const button = screen.getByRole('button');
        expect(button).toBeDefined();
        expect(button.className).toContain('bg-indigo-600');
    });

    it('shows recording state when isRecording is true', () => {
        render(
            <VoiceButton
                isRecording={true}
                onMouseDown={() => { }}
                onMouseUp={() => { }}
            />
        );
        const button = screen.getByRole('button');
        expect(button.className).toContain('bg-red-500');
        // Check for icon pulse
        const icon = button.querySelector('svg');
        expect(icon).toBeDefined();
        expect(icon?.getAttribute('class')).toContain('animate-pulse');
    });

    it('calls onMouseDown and onMouseUp handlers', () => {
        const handleMouseDown = vi.fn();
        const handleMouseUp = vi.fn();

        render(
            <VoiceButton
                isRecording={false}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
            />
        );

        const button = screen.getByRole('button');

        fireEvent.mouseDown(button);
        expect(handleMouseDown).toHaveBeenCalledTimes(1);

        fireEvent.mouseUp(button);
        expect(handleMouseUp).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disconnected', () => {
        render(
            <VoiceButton
                isRecording={false}
                onMouseDown={() => { }}
                onMouseUp={() => { }}
                disabled={true}
            />
        );
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button.className).toContain('cursor-not-allowed');
    });
});
