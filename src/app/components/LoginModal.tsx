'use client';

import { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../lib/api';
import { getDeviceUUID } from '../lib/auth';

interface LoginModalProps {
    onClose: () => void;
    onLoginSuccess: (user: any) => void;
}

export default function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
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

            // Save token
            localStorage.setItem('votemap_token', access_token);

            onLoginSuccess(user);
            onClose();
        } catch (err) {
            setError('인증번호 불일치.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold mb-4">휴대폰 번호로 시작하기</h2>
                <p className="text-sm text-gray-500 mb-6">
                    투표 기록을 영구 저장하고<br />
                    '우리 동네 주민' 배지를 획득하세요.
                </p>

                {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

                {step === 'input' ? (
                    <div className="space-y-4">
                        <input
                            type="tel"
                            placeholder="01012345678"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none"
                        />
                        <button
                            onClick={handleRequestOtp}
                            disabled={phoneNumber.length < 10}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl disabled:bg-gray-300"
                        >
                            인증번호 받기
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="인증번호 6자리"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none"
                        />
                        <button
                            onClick={handleVerifyOtp}
                            className="w-full py-4 bg-green-500 text-white font-bold rounded-xl"
                        >
                            인증하고 시작하기
                        </button>
                        <button
                            onClick={() => setStep('input')}
                            className="w-full py-2 text-gray-400 text-sm"
                        >
                            번호 다시 입력
                        </button>
                    </div>
                )}

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400">
                    ✕
                </button>
            </div>
        </div>
    );
}
