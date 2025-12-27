'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from './LoginModal';
import { useAuth } from '../context/AuthContext';

export default function AuthHeader() {
    const { user, login } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const router = useRouter();

    return (
        <>
            <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 w-full max-w-7xl mx-auto pointer-events-none">
                <div className="flex items-center gap-2 cursor-pointer pointer-events-auto" onClick={() => router.push('/')}>
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">V</div>
                    <span className="text-xl font-bold tracking-tight text-gray-900">VOTEMAP</span>
                </div>

                <div className="pointer-events-auto">
                    {user ? (
                        <div
                            className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-xl transition-colors"
                            onClick={() => router.push('/profile')}
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gray-900">{user.nickname}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
                                {user.profile_image ? (
                                    <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl text-gray-400">👤</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsLoginModalOpen(true)}
                            className="px-5 py-2 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                        >
                            로그인
                        </button>
                    )}
                </div>
            </header>

            {isLoginModalOpen && (
                <LoginModal
                    onClose={() => setIsLoginModalOpen(false)}
                    onLoginSuccess={(userData) => {
                        // State update is handled by AuthContext now, but if LoginModal passes user directly, we can use it.
                        // But better to expect the context to update via login methods there.
                        // The LoginModal implementation needs to be compatible.
                        // For now, refreshing the context or re-fetching might be needed if LoginModal handles auth independently.
                        // Actually, LoginModal calls `onLoginSuccess`, we can just ensure the context state is refreshed or passed in.
                        // However, typically LoginModal does the API call. Let's look at LoginModal again.
                        // LoginModal does axios call then calls onLoginSuccess.
                        // We will update LoginModal to use context `login` or just rely on passing data back.
                        // Let's rely on passed user data for visual update if context isn't using it yet, but ideally we call login() in context.
                        // But `login(token)` in context fetches user again.

                        // We will just close the modal. The user state should be updated.
                        setIsLoginModalOpen(false);
                        // If LoginModal returns the user object, we might want to manually set it in context if context exposed a setter, 
                        // but context `login` method fetches from API.
                        // We will fix LoginModal in next step to use Context properly.
                    }}
                />
            )}
        </>
    );
}
