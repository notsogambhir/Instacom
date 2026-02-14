import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Member {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    isActive: boolean;
    lastSeenAt: string;
    group?: {
        name: string;
    };
}

export const MemberListAdmin = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            const response = await api.get('/admin/members');
            setMembers(response.data);
        } catch (err) {
            console.error('Failed to load members', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = async (id: string) => {
        if (!confirm('Suspend this user?')) return;

        try {
            await api.put(`/admin/members/${id}/suspend`);
            loadMembers(); // Refresh
        } catch (err) {
            alert('Failed to suspend user');
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await api.put(`/admin/members/${id}/restore`);
            loadMembers();
        } catch (err) {
            alert('Failed to restore user');
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Team Members ({members.length})</h2>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs uppercase bg-gray-800 text-gray-400">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Last Seen</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((member) => (
                            <tr key={member.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                <td className="px-4 py-3 font-medium text-white">{member.name}</td>
                                <td className="px-4 py-3">{member.email}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs ${member.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                                            member.role === 'GROUP_ADMIN' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-gray-700 text-gray-300'
                                        }`}>
                                        {member.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs ${member.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                                            member.status === 'AFK' ? 'bg-yellow-500/20 text-yellow-400' :
                                                member.status === 'DND' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-gray-700 text-gray-400'
                                        }`}>
                                        {member.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {new Date(member.lastSeenAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                    {member.isActive ? (
                                        <button
                                            onClick={() => handleSuspend(member.id)}
                                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                                        >
                                            Suspend
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleRestore(member.id)}
                                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                        >
                                            Restore
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
