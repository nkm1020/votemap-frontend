'use client';

import { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface NicknameSetupModalProps {
    currentNickname: string;
    onClose: () => void;
    onSuccess: (newNickname: string) => void;
    isRequired?: boolean; // If true, hide close button
}

export default function NicknameSetupModal({ currentNickname, onClose, onSuccess, isRequired = false }: NicknameSetupModalProps) {
    const { token } = useAuth();
    const [nickname, setNickname] = useState(currentNickname);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim()) {
            setError('닉네임을 입력해주세요.');
            return;
        }

        if (nickname === currentNickname) {
            onClose();
            return;
        }

        setLoading(true);
        setError('');

        try {
            await axios.patch(
                getApiUrl('/users/nickname'),
                { nickname },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onSuccess(nickname);
            onClose();
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('닉네임 변경에 실패했습니다. 다시 시도해주세요.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all scale-100 relative">
                {!isRequired && (
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                )}

                <div className="text-center mb-6">
                    <h2 className="text-xl font-black text-gray-900 mb-1">
                        {isRequired ? '닉네임 설정' : '닉네임 변경'}
                    </h2>
                    <p className="text-gray-500 text-sm">
                        {isRequired
                            ? '서비스 이용을 위해 닉네임을 설정해주세요.'
                            : '닉네임은 90일에 한 번만 변경할 수 있습니다.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                            placeholder="닉네임 입력 (2-10자)"
                            maxLength={10}
                        />
                        {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {loading ? '처리 중...' : '완료'}
                    </button>
                </form>
            </div>
        </div>
    );
}
