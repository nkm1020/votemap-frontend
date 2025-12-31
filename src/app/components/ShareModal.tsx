'use client';

import { useEffect, useState } from 'react';

interface ShareModalProps {
    onClose: () => void;
    topicTitle: string;
    choice: string;
    region: string;
    percent?: number; // Optional local stat
    isLeading?: boolean; // Optional local stat
}

export default function ShareModal({ onClose, topicTitle, choice, region, percent, isLeading }: ShareModalProps) {
    const [copied, setCopied] = useState(false);

    // Dynamic sharing text
    const shareText = `[VoteMap] ${region}의 선택은?\n\n나는 "${topicTitle}"에 대해 "${choice}"를 선택했습니다.\n우리 동네 여론이 궁금하다면?`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'VoteMap - 실시간 여론 지도',
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                console.log('Share canceled or failed', err);
            }
        } else {
            handleCopyLink();
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTwitterShare = () => {
        const text = encodeURIComponent(shareText);
        const url = encodeURIComponent(shareUrl);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all scale-100 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                        🎉
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-1">투표 완료!</h2>
                    <p className="text-gray-500 text-sm">소중한 한 표가 기록되었습니다.</p>
                </div>

                {/* Vote Summary Card */}
                <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <span className="text-6xl">🗳️</span>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">{region}</span>
                            <span className="text-sm font-medium text-gray-500">{topicTitle}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">나는</p>
                        <p className="text-xl font-bold text-gray-800">"{choice}" 선택</p>
                    </div>

                    {percent !== undefined && (
                        <div className="mt-4 pt-3 border-t border-gray-200/50">
                            <p className="text-sm">
                                현재 <span className="font-bold">{region}</span>에서는<br />
                                <span className={`font-bold ${isLeading ? 'text-blue-600' : 'text-orange-500'}`}>
                                    {choice}
                                </span>가 {isLeading ? '우세합니다' : '추격 중입니다'} ({percent}%)
                            </p>
                        </div>
                    )}
                </div>

                {/* Share Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleShare}
                        className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span>🔗</span> 친구들에게 공유하기
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleTwitterShare}
                            className="py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>𝕏</span> 트윗
                        </button>
                        <button
                            onClick={handleCopyLink}
                            className={`py-3 font-bold rounded-xl transition-colors border flex items-center justify-center gap-2 ${copied ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            {copied ? '복사됨!' : '링크 복사'}
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
                >
                    결과 페이지 보기
                </button>
            </div>
        </div>
    );
}
