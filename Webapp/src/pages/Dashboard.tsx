import { VoiceButton } from '../components/ui/VoiceButton';
import { useAuth } from '../context/AuthContext';
import { useAudioSession } from '../hooks/useAudioSession';

export const Dashboard = () => {
    const { user, logout } = useAuth();
    const { isOnline, isBroadcasting, goOnline, goOffline, startBroadcasting, stopBroadcasting } = useAudioSession();

    // Toggle Online/Offline
    const handleStatusToggle = () => {
        if (isOnline) {
            goOffline();
        } else {
            goOnline();
        }
    };

    return (
        <div className="flex h-screen bg-neutral-950 text-white">
            {/* Sidebar */}
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
                {/* Status Indicator */}
                <div className="mb-8 text-center" data-testid="status-indicator">
                    <button
                        onClick={handleStatusToggle}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${isOnline
                                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            }`}
                    >
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </button>
                    <div className="mt-2 text-neutral-400 text-sm">
                        {isOnline ? 'Ready to transmit' : 'Click to go online'}
                    </div>
                </div>

                {/* Voice Button */}
                <VoiceButton
                    isRecording={isBroadcasting}
                    onMouseDown={startBroadcasting}
                    onMouseUp={stopBroadcasting}
                />
            </div>
        </div>
    );
};
