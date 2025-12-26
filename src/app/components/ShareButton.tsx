'use client';

import { useState } from 'react';

// NOTE: Kakao SDK Type Definition Placeholder
declare global {
    interface Window {
        Kakao: any;
    }
}

interface ShareButtonProps {
    title: string;
    text: string;
    url: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text,
                    url,
                });
            } catch (err) {
                console.log('Share canceled');
            }
        } else {
            handleCopy();
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleKakaoShare = () => {
        // NOTE: Kakao API Key is required here.
        // Location: c:\Users\kangmin\Desktop\votemap-frontend\src\app\layout.tsx (Script tag)
        // usage: window.Kakao.init('YOUR_JAVASCRIPT_KEY');

        if (window.Kakao && window.Kakao.isInitialized()) {
            window.Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: title,
                    description: text,
                    imageUrl: 'https://votemap.live/og-image.png', // Fallback or Dynamic URL
                    link: {
                        mobileWebUrl: url,
                        webUrl: url,
                    },
                },
            });
        } else {
            alert('카카오톡 공유 기능을 사용할 수 없습니다. (API Key 설정 필요)');
        }
    };

    return (
        <div className="flex gap-2 justify-center mt-6">
            <button
                onClick={handleShare}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-full transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                {copied ? 'Copied!' : 'Share'}
            </button>

            <button
                onClick={handleKakaoShare}
                className="bg-[#FEE500] hover:bg-[#FDD835] text-[#3c1e1e] font-bold py-3 px-6 rounded-full transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C5.373 3 0 7.378 0 12.775c0 3.46 2.195 6.52 5.514 8.243l-1.096 4.312c-.085.337.264.636.564.444l4.98-3.045c.67.091 1.355.146 2.038.146 6.627 0 12-4.378 12-9.775S18.627 3 12 3z" /></svg>
                Kakao
            </button>
        </div>
    );
}
