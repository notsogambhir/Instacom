import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export const Setup = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [name, setName] = useState('');
    const [pass, setPass] = useState('');
    const [status, setStatus] = useState<'' | 'loading' | 'error' | 'success'>('');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMsg('Missing invite token');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            await api.post('/auth/setup', { token, name, pass });
            setStatus('success');
            setMsg('Account created! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setStatus('error');
            setMsg(err.response?.data?.message || 'Setup failed');
        }
    };

    if (status === 'error' && !token) {
        return <div className="text-white p-8">Invalid Invite Link</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
            <div className="w-full max-w-md p-8 bg-gray-900 rounded-lg border border-gray-800">
                <h2 className="text-2xl font-bold mb-6 text-center text-green-400">Complete Setup</h2>
                {msg && <div className={`mb-4 p-2 rounded text-sm ${status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{msg}</div>}

                {status !== 'success' && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-green-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Set Password</label>
                            <input
                                type="password"
                                value={pass}
                                onChange={(e) => setPass(e.target.value)}
                                className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-green-500 outline-none"
                                required
                                minLength={6}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full py-2 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors disabled:opacity-50"
                        >
                            {status === 'loading' ? 'Creating Account...' : 'Finish Setup'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
