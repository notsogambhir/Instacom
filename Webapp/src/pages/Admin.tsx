import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { MemberListAdmin } from '../components/MemberListAdmin';
import { useState } from 'react';
import { InviteMemberModal } from '../components/InviteMemberModal';

export const Admin = () => {
    const { user } = useAuth();
    const [showInviteModal, setShowInviteModal] = useState(false);

    // Only admins can access
    if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'GROUP_ADMIN') {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-950 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded flex items-center gap-2"
                    >
                        <span>➕</span>
                        <span>Invite Member</span>
                    </button>
                </div>

                <MemberListAdmin />

                <InviteMemberModal
                    isOpen={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={() => {/* Refresh handled by component */ }}
                />
            </div>
        </div>
    );
};
