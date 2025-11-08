/**
 * 한국 지도 컴포넌트
 * 투표 결과에 따라 지역별로 색상을 표시합니다.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

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

// 전국 시도 경계 SVG 파일만 사용
const SVG_FILE = '전국_시도_경계';

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
 * 시도 ID를 파일명으로 변환합니다
 */
function getRegionFileName(regionId: string): string {
    const mapping: { [key: string]: string } = {
        '서울특별시': '서울특별시_시군구_경계',
        '부산광역시': '부산광역시_시군구_경계',
        '대구광역시': '대구광역시_시군구_경계',
        '인천광역시': '인천광역시_시군구_경계',
        '광주광역시': '광주광역시_시군구_경계',
        '대전광역시': '대전광역시_시군구_경계',
        '울산광역시': '울산광역시_시군구_경계',
        '세종특별자치시': '세종특별자치시_시군구_경계',
        '경기도': '경기도_시군구_경계',
        '강원도': '강원도_시군구_경계',
        '충청북도': '충청북도_시군구_경계',
        '충청남도': '충청남도_시군구_경계',
        '전라북도': '전라북도_시군구_경계',
        '전라남도': '전라남도_시군구_경계',
        '경상북도': '경상북도_시군구_경계',
        '경상남도': '경상남도_시군구_경계',
        '제주특별자치도': '제주특별자치도_시군구_경계',
    };
    return mapping[regionId] || '';
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
    const [hoveredRegion, setHoveredRegion] = useState<{ name: string; x: number; y: number } | null>(null);

    /**
     * 투표 결과에 따라 색상을 적용합니다
     */
    const applyColors = useCallback((svg: SVGElement) => {
        // 모든 path에 색상 적용 (시도 경계와 시군구 경계 모두)
        const paths = svg.querySelectorAll('path');
        paths.forEach((path) => {
            const regionName = path.getAttribute('id');
            if (!regionName) return;

            // 숨겨진 path는 건너뜀
            if (path.getAttribute('display') === 'none') {
                return;
            }

            const regionData = results[regionName];
            const dominant = getDominantChoice(regionData || {});

            let fillColor = noVoteColor;
            if (dominant === 'A') {
                fillColor = optionAColor;
            } else if (dominant === 'B') {
                fillColor = optionBColor;
            }

            path.setAttribute('fill', fillColor);
            path.setAttribute('stroke', '#ffffff');
            path.setAttribute('stroke-width', '1');
        });
    }, [results, optionAColor, optionBColor, noVoteColor]);

    /**
     * Path의 바운딩 박스를 계산합니다
     */
    const getPathBBox = (path: SVGPathElement): DOMRect => {
        const bbox = path.getBBox();
        return bbox;
    };


    /**
     * 특정 시도의 시군구 경계를 전국 시도 경계 위에 오버레이합니다
     */
    const overlayRegionDistricts = async (mainSvg: SVGElement, regionId: string) => {
        try {
            const fileName = getRegionFileName(regionId);
            if (!fileName) return;

            // 시군구 경계 SVG 로드
            const response = await fetch(`/maps-1.0.1/svg/simple/${fileName}.svg`);
            if (!response.ok) {
                console.warn(`Failed to load ${fileName}.svg: ${response.status}`);
                return;
            }
            
            const regionSvgText = await response.text();
            const parser = new DOMParser();
            const regionDoc = parser.parseFromString(regionSvgText, 'image/svg+xml');
            const regionSvg = regionDoc.querySelector('svg');
            
            if (!regionSvg) return;

            // 전국 시도 경계에서 해당 시도 path 찾기
            const regionPath = mainSvg.querySelector(`path[id="${regionId}"]`) as SVGPathElement;
            if (!regionPath) return;

            // 시도 path의 바운딩 박스
            const regionBBox = getPathBBox(regionPath);
            
            // 시군구 경계의 모든 path 가져오기
            const districtPaths = regionSvg.querySelectorAll('path');
            if (districtPaths.length === 0) return;
            
            // viewBox 가져오기 (기본값 사용)
            const viewBox = regionSvg.getAttribute('viewBox') || '0 0 800 666';
            
            // 임시 SVG를 만들어서 바운딩 박스 계산
            const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            tempSvg.setAttribute('viewBox', viewBox);
            tempSvg.style.position = 'absolute';
            tempSvg.style.visibility = 'hidden';
            tempSvg.style.width = '0';
            tempSvg.style.height = '0';
            document.body.appendChild(tempSvg);
            
            const tempGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            tempSvg.appendChild(tempGroup);
            
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            districtPaths.forEach((path) => {
                const clonedPath = path.cloneNode(true) as SVGPathElement;
                tempGroup.appendChild(clonedPath);
                const bbox = clonedPath.getBBox();
                minX = Math.min(minX, bbox.x);
                minY = Math.min(minY, bbox.y);
                maxX = Math.max(maxX, bbox.x + bbox.width);
                maxY = Math.max(maxY, bbox.y + bbox.height);
            });
            
            // 임시 SVG 제거
            document.body.removeChild(tempSvg);
            
            const districtsWidth = maxX - minX;
            const districtsHeight = maxY - minY;
            
            if (districtsWidth === 0 || districtsHeight === 0) return;
            
            // 스케일 및 이동 계산
            const scaleX = regionBBox.width / districtsWidth;
            const scaleY = regionBBox.height / districtsHeight;
            const scale = Math.min(scaleX, scaleY);
            
            const offsetX = regionBBox.x - (minX * scale);
            const offsetY = regionBBox.y - (minY * scale);
            
            // 시군구 경계 path들을 그룹으로 묶어서 추가
            const districtGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            districtGroup.setAttribute('id', `${regionId}_시군구_경계`);
            districtGroup.setAttribute('transform', `translate(${offsetX}, ${offsetY}) scale(${scale})`);
            
            districtPaths.forEach((path) => {
                const clonedPath = path.cloneNode(true) as SVGPathElement;
                districtGroup.appendChild(clonedPath);
            });
            
            // 시도 path 다음에 추가 (시도 위에 오버레이)
            const mainGroup = mainSvg.querySelector('g');
            if (mainGroup) {
                mainGroup.appendChild(districtGroup);
                
                // 시도 경계는 배경으로 유지 (투명하지 않음)
                // 시군구 경계가 완전히 시도를 덮지 못하는 부분을 채우기 위해
                // applyColors에서 이미 색상이 적용되었으므로 그대로 유지
            }
        } catch (error) {
            console.error(`Failed to load ${regionId} districts:`, error);
        }
    };

    /**
     * 모든 시도의 시군구 경계를 오버레이합니다
     */
    const overlayAllDistricts = async (mainSvg: SVGElement) => {
        const regions = [
            '서울특별시',
            '부산광역시',
            '대구광역시',
            '인천광역시',
            '광주광역시',
            '대전광역시',
            '울산광역시',
            '세종특별자치시',
            '경기도',
            '강원도',
            '충청북도',
            '충청남도',
            '전라북도',
            '전라남도',
            '경상북도',
            '경상남도',
            '제주특별자치도',
        ];

        // 모든 시도를 병렬로 로드
        await Promise.all(regions.map(regionId => overlayRegionDistricts(mainSvg, regionId)));
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

        // 기존 SVG 제거
        svgWrapperRef.current.innerHTML = '';
        setIsLoading(true);

        // 전국 시도 경계 SVG 파일 로드
        fetch(`/maps-1.0.1/svg/simple/${SVG_FILE}.svg`)
            .then((response) => response.text())
            .then(async (svgText) => {
                // 이미 SVG가 추가되었는지 다시 확인
                if (!svgWrapperRef.current || svgWrapperRef.current.querySelector('svg')) {
                    setIsLoading(false);
                    return;
                }

                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                const svgElement = svgDoc.querySelector('svg');
                
                if (!svgElement) {
                    setIsLoading(false);
                    return;
                }

                // SVG를 컨테이너에 추가하고 반응형으로 설정
                const clonedSvg = svgElement.cloneNode(true) as SVGElement;
                
                // SVG를 반응형으로 만들기
                clonedSvg.removeAttribute('width');
                clonedSvg.removeAttribute('height');
                clonedSvg.setAttribute('width', '100%');
                clonedSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                clonedSvg.style.display = 'block';
                clonedSvg.style.maxWidth = '100%';
                clonedSvg.style.height = 'auto';
                
                if (svgWrapperRef.current) {
                    svgWrapperRef.current.appendChild(clonedSvg);

                    // 먼저 시도 경계에 색상 적용 (배경)
                    applyColors(clonedSvg);

                    // 모든 시도의 시군구 경계 오버레이
                    await overlayAllDistricts(clonedSvg);

                    // 마우스 이벤트 추가 (오버레이 후 모든 path에 적용)
                    addMouseEvents(clonedSvg);

                    // 오버레이 후 다시 색상 적용 (시군구 경계에도 색상 적용)
                    applyColors(clonedSvg);
                }
                setIsLoading(false);
            })
            .catch((error) => {
                console.error(`Failed to load ${SVG_FILE}.svg:`, error);
                setIsLoading(false);
            });
    }, []); // 빈 의존성 배열로 한 번만 실행

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
     * 마우스 휠로 확대/축소
     */
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        
        if (!svgContainerRef.current) return;
        
        const rect = svgContainerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 마우스 위치를 SVG 좌표계로 변환
        const svgX = (mouseX - position.x) / scale;
        const svgY = (mouseY - position.y) / scale;
        
        // 확대/축소 비율 계산
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(5, scale * delta));
        
        // 마우스 위치를 중심으로 확대/축소
        const newX = mouseX - svgX * newScale;
        const newY = mouseY - svgY * newScale;
        
        setScale(newScale);
        setPosition({ x: newX, y: newY });
    };

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
    const addMouseEvents = (svg: SVGElement) => {
        const paths = svg.querySelectorAll('path');
        paths.forEach((path) => {
            const regionName = path.getAttribute('id');
            if (!regionName) return;

            // 마우스 진입
            path.addEventListener('mouseenter', (e) => {
                if (isDragging) return;
                const mouseEvent = e as MouseEvent;
                setHoveredRegion({
                    name: regionName,
                    x: mouseEvent.clientX,
                    y: mouseEvent.clientY
                });
            });

            // 마우스 이동
            path.addEventListener('mousemove', (e) => {
                if (isDragging) return;
                const mouseEvent = e as MouseEvent;
                setHoveredRegion(prev => prev ? {
                    ...prev,
                    x: mouseEvent.clientX,
                    y: mouseEvent.clientY
                } : null);
            });

            // 마우스 떠남
            path.addEventListener('mouseleave', () => {
                setHoveredRegion(null);
            });
        });
    };

    /**
     * 지역의 투표 결과를 정렬하여 상위 3개를 반환합니다
     */
    const getTopVotes = (regionName: string): Array<{ option: string; votes: number; label: string }> => {
        const regionData = results[regionName] || {};
        const votes = [
            { option: 'A', votes: regionData.A || 0, label: topic?.option_a || '옵션 A' },
            { option: 'B', votes: regionData.B || 0, label: topic?.option_b || '옵션 B' },
        ];

        return votes
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 3)
            .filter(v => v.votes > 0);
    };

    const topVotes = hoveredRegion ? getTopVotes(hoveredRegion.name) : [];
    const regionData = hoveredRegion ? results[hoveredRegion.name] : null;
    const totalVotes = regionData ? (regionData.A || 0) + (regionData.B || 0) : 0;

    return (
        <div className="w-full bg-white rounded-lg shadow-lg p-4 relative">
            {isLoading && (
                <div className="flex items-center justify-center" style={{ minHeight: '500px' }}>
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">지도를 불러오는 중...</p>
                    </div>
                </div>
            )}
            <div 
                ref={svgContainerRef} 
                className="w-full overflow-hidden relative"
                style={{ 
                    display: isLoading ? 'none' : 'block',
                    aspectRatio: '800 / 759', // 원본 SVG의 비율 유지
                    maxWidth: '100%',
                    height: 'auto',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    userSelect: 'none'
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
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
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        width: '100%',
                        height: '100%'
                    }}
                />
            </div>

            {/* 팝업 */}
            {hoveredRegion && !isDragging && topic && (
                <div
                    className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 pointer-events-none min-w-[250px] max-w-[300px]"
                    style={{
                        left: `${Math.min(hoveredRegion.x + 15, window.innerWidth - 320)}px`,
                        top: `${Math.max(10, hoveredRegion.y - 10)}px`,
                    }}
                >
                    <div className="mb-3">
                        <h3 className="font-bold text-lg text-gray-800 mb-1">{hoveredRegion.name}</h3>
                        <p className="text-sm text-gray-600">{topic.title}</p>
                    </div>
                    
                    {totalVotes > 0 ? (
                        <div className="space-y-2">
                            <div className="text-xs text-gray-500 mb-2">투표 수 상위 3개</div>
                            {topVotes.map((vote, index) => (
                                <div key={vote.option} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-400">#{index + 1}</span>
                                        <span className="text-sm font-medium text-gray-700">{vote.label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{vote.votes.toLocaleString()}표</span>
                                </div>
                            ))}
                            {topVotes.length === 0 && (
                                <div className="text-sm text-gray-500">투표 데이터가 없습니다</div>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">아직 투표가 없습니다</div>
                    )}
                </div>
            )}
        </div>
    );
}

