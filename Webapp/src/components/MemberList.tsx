import './MemberList.css';

export interface Member {
    id: string;
    name: string;
    status: 'ACTIVE' | 'AFK' | 'DND' | 'OFFLINE';
}

interface MemberListProps {
    members: Member[];
    selectedUserId?: string;
    onSelectMember: (userId: string | null) => void;
}

export function MemberList({ members, selectedUserId, onSelectMember }: MemberListProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACTIVE': return '🟢';
            case 'AFK': return '🟡';
            case 'DND': return '🔴';
            case 'OFFLINE': return '⚫';
            default: return '⚫';
        }
    };

    return (
        <div className="member-list">
            <div className="member-list-header">
                <h3>Talk To</h3>
            </div>

            <button
                className={`member-item broadcast ${!selectedUserId ? 'selected' : ''}`}
                onClick={() => onSelectMember(null)}
            >
                <span className="member-icon">📢</span>
                <span className="member-name">Broadcast to Group</span>
            </button>

            <div className="member-divider"></div>

            {members.map(member => (
                <button
                    key={member.id}
                    className={`member-item ${selectedUserId === member.id ? 'selected' : ''}`}
                    onClick={() => onSelectMember(member.id)}
                >
                    <span className="member-status">{getStatusIcon(member.status)}</span>
                    <span className="member-name">{member.name}</span>
                </button>
            ))}

            {members.length === 0 && (
                <div className="empty-state">
                    <p>No other members in your group</p>
                </div>
            )}
        </div>
    );
}
