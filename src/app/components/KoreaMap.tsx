/**
 * 한국 지도 컴포넌트
 * 투표 결과에 따라 지역별로 색상을 표시합니다.
 */

'use client';

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface VoteResults {
    [region: string]: { A?: number; B?: number; };
}

interface Topic {
    id: number;
    title: string;
    option_a: string;
    option_b: string;
}

interface KoreaMapProps {
    results: VoteResults;
    topic?: Topic;
    optionAColor?: string;
    optionBColor?: string;
    noVoteColor?: string;
}

// 상세 지도 SVG 파일 사용
const SVG_FILE = 'korea-sig-2024';

/**
 * 지역의 우세한 선택지를 결정합니다
 */
function getDominantChoice(regionData: { A?: number; B?: number }): 'A' | 'B' | 'none' {
    const a = regionData.A || 0;
    const b = regionData.B || 0;

    if (a === 0 && b === 0) return 'none';
    if (a > b) return 'A';
    if (b > a) return 'B';
    return 'none'; // 동점
}

/**
 * 한국 지도 컴포넌트
 */
export default function KoreaMap({
    results,
    topic,
    optionAColor = '#3b82f6', // 파란색
    optionBColor = '#ef4444', // 빨간색
    noVoteColor = '#e5e7eb' // 회색
}: KoreaMapProps) {
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const svgWrapperRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [scale, setScale] = useState<number>(1);
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [lastPinchDistance, setLastPinchDistance] = useState<number>(0);
    const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Calculate votes for the hovered region
    const { totalVotes, topVotes } = ((regionName) => {
        if (!regionName || !results[regionName] || !topic) return { totalVotes: 0, topVotes: [] };

        const regionVotes = results[regionName];
        const aVotes = regionVotes.A || 0;
        const bVotes = regionVotes.B || 0;
        const total = aVotes + bVotes;

        const votes = [
            { option: 'A', label: topic.option_a, votes: aVotes },
            { option: 'B', label: topic.option_b, votes: bVotes }
        ].sort((a, b) => b.votes - a.votes);

        return { totalVotes: total, topVotes: votes };
    })(hoveredRegion);

    /**
     * 투표 결과에 따라 색상을 적용합니다
     */
    const applyColors = useCallback((svg: SVGElement) => {
        // 모든 path에 색상 적용
        const paths = svg.querySelectorAll('path');
        paths.forEach((path) => {
            const regionName = path.getAttribute('id');
            const parentGroup = path.parentElement;
            const parentName = parentGroup?.tagName === 'g' ? parentGroup.getAttribute('id') : null;

            if (!regionName) return;

            // 숨겨진 path는 건너뜀
            if (path.getAttribute('display') === 'none') {
                return;
            }

            // 1. 지역(시군구) 데이터 확인
            let regionData = results[regionName];

            // 2. 없으면 상위(시도) 데이터 확인
            if (!regionData && parentName) {
                regionData = results[parentName];
            }

            const dominant = getDominantChoice(regionData || {});

            let fillColor = noVoteColor;
            if (dominant === 'A') {
                fillColor = optionAColor;
            } else if (dominant === 'B') {
                fillColor = optionBColor;
            }

            path.setAttribute('fill', fillColor);
            path.setAttribute('stroke', '#ffffff');
            path.setAttribute('stroke-width', '0.5');
            path.setAttribute('vector-effect', 'non-scaling-stroke'); // 줌 레벨에 관계없이 두께 유지
        });
    }, [results, optionAColor, optionBColor, noVoteColor]);

    /**
     * 유효한 지역 path인지 확인
     */
    const isValidRegionPath = (path: Element): boolean => {
        const id = path.getAttribute('id');
        // 레이어_1 등 비지역 ID 제외
        return !!id && !['레이어_1', 'Layer_1'].includes(id);
    };

    /**
     * SVG 파일을 로드하고 컨테이너에 추가합니다
     */
    useEffect(() => {
        if (!svgContainerRef.current || !svgWrapperRef.current) return;

        // 이미 SVG가 로드되어 있으면 스킵
        if (svgWrapperRef.current.querySelector('svg')) {
            return;
        }

        setIsLoading(true);

        // 상세 지도 SVG 파일 로드
        fetch(`/maps-1.0.1/${SVG_FILE}.svg`)
            .then((response) => response.text())
            .then(async (svgText) => {
                if (!svgWrapperRef.current || svgWrapperRef.current.querySelector('svg')) {
                    setIsLoading(false);
                    return;
                }

                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                const svgElement = svgDoc.querySelector('svg');

                if (!svgElement) {
                    console.error('No SVG element found');
                    setIsLoading(false);
                    return;
                }

                // SVG를 컨테이너에 추가하고 반응형으로 설정
                const clonedSvg = svgElement.cloneNode(true) as SVGElement;

                // SVG를 반응형으로 만들기
                clonedSvg.removeAttribute('width');
                clonedSvg.removeAttribute('height');
                clonedSvg.setAttribute('width', '100%');
                clonedSvg.setAttribute('height', '100%');
                clonedSvg.style.display = 'block';
                clonedSvg.style.maxWidth = '100%';
                // clonedSvg.style.height = 'auto'; // height: 100%로 설정하여 컨테이너에 맞춤

                if (svgWrapperRef.current) {
                    svgWrapperRef.current.innerHTML = ''; // 안전하게 클리어
                    svgWrapperRef.current.appendChild(clonedSvg);

                    // 마우스 이벤트 추가
                    addMouseEvents(clonedSvg);

                    // 색상 적용
                    applyColors(clonedSvg);
                }
                setIsLoading(false);
            })
            .catch((error) => {
                console.error(`Failed to load ${SVG_FILE}.svg:`, error);
                setIsLoading(false);
            });
    }, []);

    /**
     * 투표 결과에 따라 색상을 업데이트합니다
     */
    useEffect(() => {
        if (!svgWrapperRef.current || isLoading) return;

        const svg = svgWrapperRef.current.querySelector('svg');
        if (!svg) return;

        applyColors(svg);
    }, [applyColors, isLoading]);

    /**
     * 마우스 휠로 확대/축소 (Non-passive listener implementation)
     */
    useEffect(() => {
        const container = svgContainerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 마우스 위치를 SVG 좌표계로 변환 (현재 state 사용)
            // 주의: useEffect 의존성 때문에 scale/position이 바뀔 때마다 리스너가 재등록됨
            // 성능 영향을 줄이기 위해 useRef로 state를 관리할 수도 있지만,
            // 여기서는 코드 복잡도를 낮추기 위해 의존성 배열 사용

            // closure 문제 해결을 위해 setState의 콜백 사용 불가 (값 계산에 필요)
            // 따라서 단순히 의존성 배열에 scale, position을 넣음

            const svgX = (mouseX - position.x) / scale;
            const svgY = (mouseY - position.y) / scale;

            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(0.5, Math.min(5, scale * delta));

            const newX = mouseX - svgX * newScale;
            const newY = mouseY - svgY * newScale;

            setScale(newScale);
            setPosition({ x: newX, y: newY });
        };

        container.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', onWheel);
        };
    }, [scale, position]); // scale과 position이 변경될 때마다 리스너 갱신

    /**
     * 마우스 드래그 시작
     */
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return; // 왼쪽 버튼만
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    /**
     * 마우스 드래그 중
     */
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;

        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    /**
     * 마우스 드래그 종료
     */
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    /**
     * 터치 시작
     */
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 1) {
            // 단일 터치: 드래그
            const touch = e.touches[0];
            setIsDragging(true);
            setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
            setLastPinchDistance(0);
        } else if (e.touches.length === 2) {
            // 핀치 줌
            setIsDragging(false);
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            setLastPinchDistance(distance);
        }
    };

    /**
     * 터치 이동
     */
    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault();

        if (e.touches.length === 1 && isDragging) {
            // 단일 터치: 드래그
            const touch = e.touches[0];
            setPosition({
                x: touch.clientX - dragStart.x,
                y: touch.clientY - dragStart.y
            });
        } else if (e.touches.length === 2) {
            // 핀치 줌
            setIsDragging(false);
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];

            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            if (lastPinchDistance > 0) {
                const scaleChange = distance / lastPinchDistance;
                const newScale = Math.max(0.5, Math.min(5, scale * scaleChange));

                // 두 터치의 중점 계산
                const centerX = (touch1.clientX + touch2.clientX) / 2;
                const centerY = (touch1.clientY + touch2.clientY) / 2;

                if (!svgContainerRef.current) return;
                const rect = svgContainerRef.current.getBoundingClientRect();
                const svgX = (centerX - rect.left - position.x) / scale;
                const svgY = (centerY - rect.top - position.y) / scale;

                const newX = centerX - rect.left - svgX * newScale;
                const newY = centerY - rect.top - svgY * newScale;

                setScale(newScale);
                setPosition({ x: newX, y: newY });
            }
            setLastPinchDistance(distance);
        }
    };

    /**
     * 터치 종료
     */
    const handleTouchEnd = () => {
        setIsDragging(false);
        setLastPinchDistance(0);
    };

    /**
     * 더블 클릭으로 리셋
     */
    const handleDoubleClick = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    /**
     * SVG path 요소에 마우스 이벤트를 추가합니다
     */
    /**
     * SVG path 요소에 마우스 이벤트를 추가합니다
     */
    const addMouseEvents = (svg: SVGElement) => {
        // 먼저 시군구 경계 path에 이벤트 추가 (더 구체적인 경계)
        const districtGroups = svg.querySelectorAll('g[id$="_시군구_경계"]');
        districtGroups.forEach((group) => {
            const paths = group.querySelectorAll('path');
            paths.forEach((path) => {
                const regionName = path.getAttribute('id');
                if (!regionName) return;

                // 마우스 진입
                path.addEventListener('mouseenter', (e: MouseEvent) => {
                    if (isDragging) return;
                    e.stopPropagation(); // 이벤트 전파 중단

                    // 마우스 위치 즉시 저장 (툴팁 초기 위치 보장)
                    lastMousePos.current = { x: e.clientX, y: e.clientY };

                    // 스타일 적용 (어둡게 만들기)
                    path.style.filter = 'brightness(0.8)';
                    path.style.transition = 'filter 0.2s ease';

                    setHoveredRegion(regionName);
                });

                // 마우스 떠남
                path.addEventListener('mouseleave', () => {
                    path.style.filter = '';
                    setHoveredRegion(null);
                });
            });
        });

        // 시도 경계 path에 이벤트 추가 (시군구 경계가 없는 경우를 위해)
        // 단, pointer-events가 none인 경우는 건너뛰고, 이미 시군구 경계에 속한 path도 건너뜀
        const allPaths = svg.querySelectorAll('path');
        allPaths.forEach((path) => {
            // 이미 시군구 경계 그룹에 속한 path는 건너뜀
            if (path.closest('g[id$="_시군구_경계"]')) return;

            // pointer-events가 none인 path는 건너뜀
            const computedStyle = window.getComputedStyle(path);
            if (computedStyle.pointerEvents === 'none') return;

            const regionName = path.getAttribute('id');
            if (!regionName) return;

            // 마우스 진입
            path.addEventListener('mouseenter', (e: MouseEvent) => {
                if (isDragging) return;

                // 마우스 위치 즉시 저장
                lastMousePos.current = { x: e.clientX, y: e.clientY };

                // 스타일 적용 (어둡게 만들기)
                path.style.filter = 'brightness(0.8)';
                path.style.transition = 'filter 0.2s ease';

                setHoveredRegion(regionName);
            });

            // 마우스 떠남
            path.addEventListener('mouseleave', () => {
                path.style.filter = '';
                setHoveredRegion(null);
            });
        });
    };

    /**
     * tooltip 위치 업데이트 (zoom/pan 시에도 위치 유지) - 삭제됨 (마우스 추적으로 변경)
     */
    // useLayoutEffect 제거

    /**
     * 확대 버튼 클릭
     */
    const handleZoomIn = () => {
        const newScale = Math.min(5, scale * 1.2);
        setScale(newScale);
    };

    /**
     * 축소 버튼 클릭
     */
    const handleZoomOut = () => {
        const newScale = Math.max(0.5, scale / 1.2);
        setScale(newScale);
    };

    const lastMousePos = useRef<{ x: number; y: number } | null>(null);

    /**
     * 툴팁 위치 업데이트 함수
     */
    const updateTooltipPosition = (x: number, y: number) => {
        if (!tooltipRef.current) return;

        const TOOLTIP_OFFSET = 20;
        const tooltipWidth = tooltipRef.current.offsetWidth || 240;
        const tooltipHeight = tooltipRef.current.offsetHeight || 120;

        let left = x + TOOLTIP_OFFSET;
        let top = y + TOOLTIP_OFFSET;

        // 화면 오른쪽을 벗어나면 왼쪽으로 이동
        if (left + tooltipWidth > window.innerWidth) {
            left = x - tooltipWidth - TOOLTIP_OFFSET;
        }

        // 화면 아래쪽을 벗어나면 위쪽으로 이동
        if (top + tooltipHeight > window.innerHeight) {
            top = y - tooltipHeight - TOOLTIP_OFFSET;
        }

        tooltipRef.current.style.left = `${left}px`;
        tooltipRef.current.style.top = `${top}px`;
    };

    /**
     * 툴팁이 나타날 때 초기 위치 설정
     */
    useLayoutEffect(() => {
        if (hoveredRegion && lastMousePos.current) {
            updateTooltipPosition(lastMousePos.current.x, lastMousePos.current.y);
        }
    }, [hoveredRegion]);

    return (
        <div className="w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 p-6 relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-3xl">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800 mx-auto mb-4"></div>
                        <p className="text-sm font-medium text-gray-500">Loading Map...</p>
                    </div>
                </div>
            )}

            <div
                ref={svgContainerRef}
                className="w-full overflow-hidden relative rounded-2xl bg-gray-50/50"
                style={{
                    // isLoading일 때도 공간을 차지하도록 변경하여 레이아웃 시프트 방지
                    aspectRatio: '800 / 759',
                    maxWidth: '100%',
                    height: 'auto',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    userSelect: 'none'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={(e) => {
                    handleMouseMove(e);

                    // 마우스 위치 저장
                    lastMousePos.current = { x: e.clientX, y: e.clientY };

                    // 툴팁 위치 업데이트 (마우스 추적)
                    if (hoveredRegion && tooltipRef.current) {
                        updateTooltipPosition(e.clientX, e.clientY);
                    }
                }}
                onMouseUp={handleMouseUp}
                onMouseLeave={(e) => {
                    handleMouseUp();
                    // 툴팁 숨김 등 추가 처리가 필요하다면 여기에 작성
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={handleDoubleClick}
            >
                <div
                    ref={svgWrapperRef}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: '0 0',
                        transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)', // 부드러운 전환
                        width: '100%',
                        height: '100%'
                    }}
                />
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
                <button
                    onClick={handleZoomIn}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg border border-gray-100 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all duration-200"
                    aria-label="Zoom In"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
                <button
                    onClick={handleZoomOut}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg border border-gray-100 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all duration-200"
                    aria-label="Zoom Out"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>

            {/* 팝업 (Portal 사용) */}
            {hoveredRegion && !isDragging && topic && (
                typeof document !== 'undefined' && createPortal(
                    <div
                        ref={tooltipRef}
                        className="fixed bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 p-4 z-[9999] pointer-events-none min-w-[240px]"
                        style={{
                            // 초기 위치는 hidden으로 두거나, layoutEffect에서 설정하므로 비워둠
                            left: lastMousePos.current ? lastMousePos.current.x + 20 : 0,
                            top: lastMousePos.current ? lastMousePos.current.y + 20 : 0,
                        }}
                    >
                        <div className="mb-4 pb-3 border-b border-gray-100">
                            <h3 className="font-bold text-lg text-gray-900 leading-tight">{hoveredRegion}</h3>
                            <p className="text-xs text-gray-500 mt-1 font-medium">{topic.title}</p>
                        </div>

                        {totalVotes > 0 ? (
                            <div className="space-y-3">
                                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Top Choices</div>
                                {topVotes.map((vote, index) => (
                                    <div key={vote.option} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <span className={`
                                                flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold
                                                ${index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
                                            `}>
                                                {index + 1}
                                            </span>
                                            <span className="text-sm font-medium text-gray-700">{vote.label}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 font-numeric tabular-nums">{vote.votes.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400 py-2 text-center italic">No votes yet</div>
                        )}
                    </div>,
                    document.body
                )
            )}
        </div>
    );
}

