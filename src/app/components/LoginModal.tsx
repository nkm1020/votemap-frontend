'use client';

import { useState } from 'react';
import axios from 'axios';
import { getApiUrl, getGoogleAuthUrl } from '../lib/api';
import { getDeviceUUID } from '../lib/auth';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
    onClose: () => void;
    onLoginSuccess: (user: any) => void;
}

export default function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
    const { login } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'input' | 'verify'>('input');
    const [error, setError] = useState('');

    const handleRequestOtp = async () => {
        try {
            await axios.post(getApiUrl('/auth/otp/request'), { phone_number: phoneNumber });
            setStep('verify');
            setError('');
        } catch (err) {
            setError('문자 발송 실패. 번호를 확인해주세요.');
        }
    };

    const handleVerifyOtp = async () => {
        try {
            const deviceUuid = getDeviceUUID();
            const response = await axios.post(getApiUrl('/auth/otp/verify'), {
                phone_number: phoneNumber,
                code: otp,
                device_uuid: deviceUuid,
            });

            const { access_token, user } = response.data;

            // Use context login to update global state
            await login(access_token);

            onLoginSuccess(user);
            onClose();
        } catch (err) {
            setError('인증번호 불일치.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold mb-4">로그인 / 회원가입</h2>
                <p className="text-sm text-gray-500 mb-6">
                    투표 기록을 영구 저장하고<br />
                    '우리 동네 주민' 배지를 획득하세요.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={() => window.location.href = getGoogleAuthUrl()}
                        className="w-full py-4 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                        {/* Simple Google Icon SVG */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google 계정으로 회원가입
                    </button>

                    {/* Optional Divider or Secondary Options here if needed */}
                </div>

                <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
