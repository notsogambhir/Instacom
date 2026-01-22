import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import '@testing-library/jest-dom';

// Mock API
const mockPost = vi.fn();
vi.mock('../api/client', () => ({
    api: {
        post: (...args: any[]) => mockPost(...args),
        defaults: { headers: { common: {} } }
    }
}));

describe('App Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default to logged in
        mockPost.mockImplementation((url) => {
            if (url === '/auth/refresh') {
                return Promise.resolve({
                    data: {
                        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'MEMBER' },
                        token: 'fake-jwt'
                    }
                });
            }
            return Promise.resolve({ data: {} });
        });
    });

    it('starts in OFFLINE state', async () => {
        render(<App />);
        // Wait for loading to finish
        await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

        expect(screen.getByRole('button', { name: /OFFLINE/i })).toBeInTheDocument();
        expect(screen.getByText(/Click OFFLINE to Connect/i)).toBeInTheDocument();
    });

    it('connects when clicking OFFLINE button', async () => {
        const user = userEvent.setup();
        render(<App />);
        await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

        // Find offline button
        const offlineBtn = screen.getByRole('button', { name: /OFFLINE/i });
        await user.click(offlineBtn);

        // Should change to ONLINE, which is a span, so use findByTestId
        expect(await screen.findByTestId('connection-status')).toHaveTextContent(/ONLINE/i);
        expect(screen.getByText(/Hold Space or Click to Talk/i)).toBeDefined();
    });

    it('activates PTT when holding button (after connecting)', async () => {
        const user = userEvent.setup();
        render(<App />);
        await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

        // Connect first
        await user.click(screen.getByRole('button', { name: /OFFLINE/i }));
        await screen.findByTestId('connection-status');

        // Find Voice Button
        // The voice button doesn't have text, but it is the main button in the center.
        // We can rely on looking for the one that isn't the Connect/Disconnect button if strictly needed,
        // or adding an aria-label to VoiceButton would be better Practice.
        // For now, let's find by role 'button' and filter.

        // Actually, let's add aria-label to VoiceButton in a previous step? 
        // Or just query selector.
        // Let's assume there are multiple buttons.

        // VoiceButton has `button` tag.
        const buttons = screen.getAllByRole('button');
        // 0 is likely the Connect button (if it renders as button, yes it does).
        // voice button is likely the massive one.

        // Better strategy: Use a test-id or aria-label.
        // I will use `getAllByRole('button')` and verify the one with 'bg-indigo-600' class or similar logic in a real app,
        // but for now let's hope it's resilient. 
        // The Connect button says "ONLINE" or "OFFLINE". The Voice button has no text.

        const voiceButton = buttons.find(b => !b.textContent?.includes('LINE'));
        expect(voiceButton).toBeDefined();

        if (voiceButton) {
            // Need to use pointer interactions for mouse down/up with userEvent
            // fireEvent.mouseDown is simpler for this specific low-level event if userEvent doesn't support hold easily without pointer API
            // But let's try fireEvent for PTT part as it is specific event handler
            // or use user.pointer({keys: '[MouseLeft>]', target: voiceButton})

            // Reverting to fireEvent for PTT specifically or retry fireEvent for click? 
            // Let's stick to userEvent for CLICK, but maybe fireEvent for MouseDown/Up is fine.
            // But wait, if click failed with fireEvent, maybe mouseDown fails too?
            // Actually click failed because maybe it wasn't trusted?

            // Let's use fireEvent for PTT for now, as it worked in the VoiceButton unit test.
            const { fireEvent } = await import('@testing-library/react');
            fireEvent.mouseDown(voiceButton);
            expect(await screen.findByText(/Broadcasting.../i)).toBeDefined();

            fireEvent.mouseUp(voiceButton);
            expect(screen.getByText(/Hold Space or Click to Talk/i)).toBeDefined();
        }
    });
});
