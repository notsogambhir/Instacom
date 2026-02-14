import { useState } from 'react';
import { api } from '../api/client';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const InviteMemberModal = ({ isOpen, onClose, onSuccess }: InviteMemberModalProps) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'GROUP_ADMIN' | 'MEMBER'>('MEMBER');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [inviteLink, setInviteLink] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/admin/invite', {
                email,
                role,
                groupId: null // Backend will use auth user's groupId
            });

            setInviteLink(response.data.link);
            setTimeout(() => {
                onSuccess();
                handleClose();
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create invite');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setRole('MEMBER');
        setError('');
        setInviteLink('');
        onClose();
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 w-full max-w-md">
                <h2 className="text-xl font-bold text-white mb-4">Invite Member</h2>

                {inviteLink ? (
                    <div className="space-y-4">
                        <div className="bg-green-500/20 border border-green-500 rounded p-4">
                            <p className="text-green-400 text-sm mb-2">✅ Invite created successfully!</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inviteLink}
                                    readOnly
                                    className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                                />
                                <button
                                    onClick={copyLink}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500 rounded p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-green-500 outline-none"
                                placeholder="member@company.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Role
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-green-500 outline-none"
                            >
                                <option value="MEMBER">Member</option>
                                <option value="GROUP_ADMIN">Group Admin</option>
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Send Invite'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
