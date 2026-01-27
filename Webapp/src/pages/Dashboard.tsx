import { useState, useEffect } from 'react';
import { VoiceButton } from '../components/ui/VoiceButton';
import { StatusToggle, type UserStatus } from '../components/StatusToggle';
import { MemberList, type Member } from '../components/MemberList';
import { HistoryPanel } from '../components/HistoryPanel';
import { useAuth } from '../context/AuthContext';
import { useAudioSession } from '../hooks/useAudioSession';
import { api } from '../api/client';

export const Dashboard = () => {
    const { user, logout } = useAuth();
    const { isOnline, isBroadcasting, target, goOnline, goOffline, startBroadcasting, stopBroadcasting, selectTarget } = useAudioSession();
    const [userStatus, setUserStatus] = useState<UserStatus>('OFFLINE');
    const [members, setMembers] = useState<Member[]>([]);

    // Fetch group members
    useEffect(() => {
        if (isOnline && user?.groupId) {
            fetchMembers();
        }
    }, [isOnline, user?.groupId]);

    const fetchMembers = async () => {
        try {
            const response = await api.get(`/groups/${user?.groupId}/members`);
            setMembers(response.data || []);
        } catch (err) {
            console.error('Failed to fetch members:', err);
            // Fallback to empty array
            setMembers([]);
        }
    };

    // Toggle Online/Offline
    const handleStatusToggle = () => {
        if (isOnline) {
            goOffline();
            setUserStatus('OFFLINE');
        } else {
            goOnline();
            setUserStatus('ACTIVE');
        }
    };

    // Handle status change
    const handleStatusChange = async (status: UserStatus) => {
        try {
            await api.post('/user/status', { status });
            setUserStatus(status);
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    // Handle member selection
    const handleMemberSelect = (userId: string | null) => {
        if (userId) {
            selectTarget({ type: 'DIRECT', userId });
        } else {
            selectTarget({ type: 'BROADCAST' });
        }
    };

    const [showHistory, setShowHistory] = useState(false);

    return (
        <div className="flex h-screen bg-neutral-950 text-white">
            {/* Left Sidebar - User & Channel */}
            <div className="w-64 bg-neutral-900 border-r border-white/10 p-4">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold">I</div>
                    <span className="font-semibold text-lg">InstaCom</span>
                </div>

                <div className="space-y-1">
                    <div className="px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium">
                        General Channel
                    </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                    <div className="p-3 bg-neutral-800 rounded-lg mb-2">
                        <div className="text-sm font-medium">{user?.name || user?.email}</div>
                        <div className="text-xs text-neutral-400 flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            {isOnline ? 'Online' : 'Offline'}
                        </div>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="w-full py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                {/* History Toggle Button */}
                {isOnline && (
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="absolute top-4 right-4 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-neutral-300 transition-colors flex items-center gap-2"
                    >
                        📜 {showHistory ? 'Hide History' : 'Show History'}
                    </button>
                )}

                {/* Status Indicator & Toggle */}
                <div className="mb-8 text-center" data-testid="status-indicator">
                    <button
                        onClick={handleStatusToggle}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors mb-4 ${isOnline
                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            }`}
                    >
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </button>

                    {isOnline && (
                        <StatusToggle
                            currentStatus={userStatus}
                            onStatusChange={handleStatusChange}
                        />
                    )}

                    <div className="mt-4 text-neutral-400 text-sm">
                        {isOnline ? (
                            target.type === 'BROADCAST'
                                ? '📢 Broadcasting to group'
                                : '👤 Talking to 1 person'
                        ) : 'Click to go online'}
                    </div>
                </div>

                {/* Voice Button */}
                <VoiceButton
                    isRecording={isBroadcasting}
                    onMouseDown={startBroadcasting}
                    onMouseUp={stopBroadcasting}
                />
            </div>

            {/* Right Sidebar - Member List */}
            {isOnline && !showHistory && (
                <div className="w-64 bg-neutral-900 border-l border-white/10 p-4">
                    <MemberList
                        members={members}
                        selectedUserId={target.type === 'DIRECT' ? target.userId : undefined}
                        onSelectMember={handleMemberSelect}
                    />
                </div>
            )}

            {/* Right Sidebar - History Panel */}
            {isOnline && showHistory && (
                <div className="w-80 bg-neutral-900 border-l border-white/10 p-4">
                    <HistoryPanel />
                </div>
            )}
        </div>
    );
};
