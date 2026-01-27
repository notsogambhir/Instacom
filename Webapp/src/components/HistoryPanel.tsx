import { useState, useEffect } from 'react';
import { VoiceMessageCard, type VoiceMessage } from './VoiceMessageCard';
import { api } from '../api/client';
import './HistoryPanel.css';

type TabType = 'group' | 'direct';

export function HistoryPanel() {
    const [activeTab, setActiveTab] = useState<TabType>('group');
    const [messages, setMessages] = useState<VoiceMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        loadMessages();
        loadPendingCount();
    }, [activeTab]);

    const loadMessages = async () => {
        setLoading(true);
        try {
            const response = await api.get('/voice-messages/history', {
                params: { type: activeTab }
            });
            setMessages(response.data || []);
        } catch (err) {
            console.error('Failed to load messages:', err);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const loadPendingCount = async () => {
        try {
            const response = await api.get('/voice-messages/pending');
            const pending = response.data || [];
            setPendingCount(pending.length);
        } catch (err) {
            console.error('Failed to load pending count:', err);
        }
    };

    const handlePlay = async (messageId: string) => {
        try {
            await api.post(`/voice-messages/${messageId}/played`);
            // Update local state
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === messageId ? { ...msg, isPlayed: true } : msg
                )
            );
            loadPendingCount();
        } catch (err) {
            console.error('Failed to mark message as played:', err);
        }
    };

    const unplayedCount = messages.filter(m => !m.isPlayed).length;

    return (
        <div className="history-panel">
            <div className="history-header">
                <h3>History</h3>
                {pendingCount > 0 && (
                    <span className="pending-badge">{pendingCount} new</span>
                )}
            </div>

            <div className="history-tabs">
                <button
                    className={`history-tab ${activeTab === 'group' ? 'active' : ''}`}
                    onClick={() => setActiveTab('group')}
                >
                    📢 Group
                    {activeTab === 'group' && unplayedCount > 0 && (
                        <span className="tab-badge">{unplayedCount}</span>
                    )}
                </button>
                <button
                    className={`history-tab ${activeTab === 'direct' ? 'active' : ''}`}
                    onClick={() => setActiveTab('direct')}
                >
                    👤 Direct
                    {activeTab === 'direct' && unplayedCount > 0 && (
                        <span className="tab-badge">{unplayedCount}</span>
                    )}
                </button>
            </div>

            <div className="history-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading messages...</p>
                    </div>
                ) : messages.length > 0 ? (
                    <div className="message-list">
                        {messages.map(message => (
                            <VoiceMessageCard
                                key={message.id}
                                message={message}
                                onPlay={handlePlay}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>
                            {activeTab === 'group'
                                ? 'No group messages yet'
                                : 'No direct messages yet'}
                        </p>
                        <span className="empty-hint">
                            Messages will appear here after your first transmission
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
