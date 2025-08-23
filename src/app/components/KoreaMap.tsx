// votemap-frontend/src/app/components/KoreaMap.tsx

import React, { useState } from 'react';

const KoreaMap = ({ results }) => {
    // 툴팁에 표시될 정보와 위치를 관리합니다.
    const [tooltip, setTooltip] = useState({
        visible: false,
        content: '',
        x: 0,
        y: 0,
    });

    // 각 지역의 색상을 계산하는 함수
    const getRegionColor = (regionId) => {
        const regionData = results[regionId];
        if (!regionData) return '#B8B8B8'; // 데이터 없으면 기본색

        const aVotes = regionData.A || 0;
        const bVotes = regionData.B || 0;
        const totalVotes = aVotes + bVotes;

        if (totalVotes === 0) return '#B8B8B8'; // 투표 없으면 기본색

        const aRatio = aVotes / totalVotes;

        // A(부먹)가 50% 이상이면 파란색 계열, 미만이면 빨간색 계열
        // 승리 비율에 따라 색의 농도를 조절합니다.
        if (aRatio > 0.5) {
            const opacity = (aRatio - 0.5) * 2; // 0~1 사이 값
            return `rgba(0, 0, 255, ${opacity * 0.8 + 0.2})`; // 파란색
        } else {
            const opacity = (0.5 - aRatio) * 2; // 0~1 사이 값
            return `rgba(255, 0, 0, ${opacity * 0.8 + 0.2})`; // 빨간색
        }
    };

    // 마우스를 올렸을 때 툴팁을 보여주는 함수
    const handleMouseOver = (e) => {
        const regionId = e.target.id;
        if (regionId && results[regionId]) {
            const regionData = results[regionId];
            const aVotes = regionData.A || 0;
            const bVotes = regionData.B || 0;
            const content = `${regionId}: 부먹 ${aVotes}표 vs 찍먹 ${bVotes}표`;

            setTooltip({
                visible: true,
                content: content,
                x: e.clientX + 15,
                y: e.clientY,
            });
        }
    };

    // 마우스가 벗어났을 때 툴팁을 숨기는 함수
    const handleMouseOut = () => {
        setTooltip({ ...tooltip, visible: false });
    };

    // SVG 코드 자체를 컴포넌트로 만듭니다.
    const SvgMap = () => (
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 509 716.1" width="100%" height="100%">
            {/* SVG의 모든 path와 polygon에 동적으로 색상을 적용하고 이벤트 핸들러를 추가합니다. */}
            {/* 이 예시에서는 '서울특별시'와 '부산광역시'만 동적으로 처리합니다. */}
            {/* 실제로는 모든 지역 태그를 이렇게 바꿔줘야 합니다. */}

            <style jsx="true">{`
        path, polygon { transition: fill 0.2s ease-in-out; }
        path:hover, polygon:hover { stroke: #FFFF00; stroke-width: 2; }
      `}</style>

            <g id="전국지도">
                {/* ... (SVG의 다른 부분) ... */}
                <g id="서울특별시_그룹">
                    <path
                        id="서울특별시"
                        fill={getRegionColor('서울특별시')}
                        d="..." // 서울특별시의 d 속성 값
                    />
                </g>
                <g id="부산광역시_그룹">
                    <path
                        id="부산광역시"
                        fill={getRegionColor('부산광역시')}
                        d="..." // 부산광역시의 d 속성 값
                    />
                </g>
                {/* ... 나머지 모든 지역들도 위와 같이 fill 속성을 동적으로 바꿔줍니다 ... */}
            </g>
        </svg>
    );

    return (
        <div onMouseMove={handleMouseOver} onMouseOut={handleMouseOut} style={{ position: 'relative' }}>
            {tooltip.visible && (
                <div
                    style={{
                        position: 'fixed',
                        top: tooltip.y,
                        left: tooltip.x,
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        pointerEvents: 'none', // 툴팁이 마우스 이벤트를 방해하지 않도록 설정
                    }}
                >
                    {tooltip.content}
                </div>
            )}
            <SvgMap />
        </div>
    );
};

export default KoreaMap;