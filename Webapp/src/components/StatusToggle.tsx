import { useState, useEffect } from 'react';
import './StatusToggle.css';

export type UserStatus = 'ACTIVE' | 'AFK' | 'DND' | 'OFFLINE';

interface StatusToggleProps {
    currentStatus: UserStatus;
    onStatusChange: (status: UserStatus) => void;
}

export function StatusToggle({ currentStatus, onStatusChange }: StatusToggleProps) {
    const [status, setStatus] = useState<UserStatus>(currentStatus);

    useEffect(() => {
        setStatus(currentStatus);
    }, [currentStatus]);

    const handleStatusChange = (newStatus: UserStatus) => {
        setStatus(newStatus);
        onStatusChange(newStatus);
    };

    return (
        <div className="status-toggle">
            <button
                onClick={() => handleStatusChange('ACTIVE')}
                className={`status-btn ${status === 'ACTIVE' ? 'active' : ''}`}
                title="Active - Receive live audio"
            >
                <span className="status-icon">🟢</span>
                <span className="status-label">Active</span>
            </button>

            <button
                onClick={() => handleStatusChange('AFK')}
                className={`status-btn ${status === 'AFK' ? 'active' : ''}`}
                title="Away - Audio saved for later"
            >
                <span className="status-icon">🟡</span>
                <span className="status-label">Away</span>
            </button>

            <button
                onClick={() => handleStatusChange('DND')}
                className={`status-btn ${status === 'DND' ? 'active' : ''}`}
                title="Do Not Disturb - Silent mode"
            >
                <span className="status-icon">🔴</span>
                <span className="status-label">DND</span>
            </button>
        </div>
    );
}
