'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { VOTE_REGIONS, VoteRegion } from '../lib/vote-regions';

interface RegionSearchProps {
    onSelect: (region: VoteRegion) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function RegionSearch({ onSelect, disabled, placeholder }: RegionSearchProps) {
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [inputFocus, setInputFocus] = useState(false);
    const [selectedName, setSelectedName] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const filteredRegions = useMemo(() => {
        if (!query) return [];
        const cleanQuery = query.replace(/\s+/g, '');

        return VOTE_REGIONS.filter(region =>
            region.name.includes(query) ||
            region.name.replace(/\s+/g, '').includes(cleanQuery)
        ).sort((a, b) => {
            const nameA = a.name;
            const nameB = b.name;
            const cleanNameA = nameA.replace(/\s+/g, '');
            const cleanNameB = nameB.replace(/\s+/g, '');

            // 1. Starts with query (Priority 1)
            const aStarts = nameA.startsWith(query) || cleanNameA.startsWith(cleanQuery);
            const bStarts = nameB.startsWith(query) || cleanNameB.startsWith(cleanQuery);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            // 2. Word starts with query (Priority 2 - e.g. "Jong" matches "Jongno-gu")
            const aWordStart = nameA.split(' ').some(part => part.startsWith(query));
            const bWordStart = nameB.split(' ').some(part => part.startsWith(query));
            if (aWordStart && !bWordStart) return -1;
            if (!aWordStart && bWordStart) return 1;

            // 3. Match position (Priority 3 - Earlier match is better)
            const aIdx = cleanNameA.indexOf(cleanQuery);
            const bIdx = cleanNameB.indexOf(cleanQuery);
            return aIdx - bIdx;
        }).slice(0, 10);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (region: VoteRegion) => {
        onSelect(region);
        setQuery(region.name);
        setSelectedName(region.name);
        setShowResults(false);
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setShowResults(true);
        setFocusedIndex(-1); // Reset focus on new search
        if (selectedName && e.target.value !== selectedName) {
            // Reset selection if user types something new
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showResults || filteredRegions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev => (prev < filteredRegions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < filteredRegions.length) {
                handleSelect(filteredRegions[focusedIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowResults(false);
        }
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleInput}
                    onFocus={() => {
                        setInputFocus(true);
                        if (query) setShowResults(true);
                    }}
                    placeholder={placeholder || "지역을 검색하세요 (예: 종로구, 해운대구)"}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    disabled={disabled}
                    onKeyDown={handleKeyDown}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    🔍
                </div>
            </div>

            {showResults && query && filteredRegions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {filteredRegions.map((region, index) => (
                        <li
                            key={region.id}
                            className={`px-4 py-3 cursor-pointer border-b border-gray-50 last:border-none transition-colors ${index === focusedIndex ? 'bg-blue-100' : 'hover:bg-blue-50'
                                }`}
                            onClick={() => handleSelect(region)}
                            onMouseEnter={() => setFocusedIndex(index)}
                            ref={(el) => {
                                if (index === focusedIndex && el) {
                                    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                                }
                            }}
                        >
                            <span className="text-gray-800 font-medium">{region.name}</span>
                        </li>
                    ))}
                </ul>
            )}

            {showResults && query && filteredRegions.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl p-4 text-center text-gray-500">
                    검색 결과가 없습니다.
                </div>
            )}
        </div>
    );
}
