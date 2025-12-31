'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../lib/api';
import { getDeviceUUID } from '../../lib/auth';
import axios from 'axios';

function LoginCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            const handleLogin = async () => {
                try {
                    // Update global context state
                    await login(token);

                    // Sync anonymous votes
                    const uuid = getDeviceUUID();
                    if (uuid) {
                        await axios.post(getApiUrl('/auth/sync'), {
                            device_uuid: uuid
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    }
                } catch (e) {
                    console.error('Login processing failed', e);
                } finally {
                    router.push('/profile');
                }
            };

            handleLogin();
        } else {
            router.push('/');
        }
    }, [router, searchParams, login]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <h2 className="text-2xl font-bold mb-4">로그인 처리 중...</h2>
            <p className="text-gray-500">잠시만 기다려주세요.</p>
        </div>
    );
}

export default function LoginSuccessPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <p className="text-gray-500">Loading...</p>
            </div>
        }>
            <LoginCallback />
        </Suspense>
    );
}
