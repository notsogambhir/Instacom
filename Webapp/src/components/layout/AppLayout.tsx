import type { ReactNode } from 'react';

export const AppLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
            <main className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6">
                {children}
            </main>
        </div>
    );
};
