#!/usr/bin/env python3
"""
Combine simplified SVG files from statgarten/maps repository into a single map
"""

from pathlib import Path
import re

# Path to the maps-1.0.1 SVG folder
SIMPLE_SVG_DIR = Path(__file__).parent.parent / "maps-1.0.1" / "svg" / "simple"
OUTPUT_FILE = Path(__file__).parent.parent / "public" / "korea-map.svg"

# 시도 경계를 먼저, 그 다음 시군구 경계
REGIONS = [
    "전국_시도_경계",  # 시도 경계를 먼저 추가 (전체 지도 구조)
    "서울특별시_시군구_경계",
    "부산광역시_시군구_경계",
    "대구광역시_시군구_경계",
    "인천광역시_시군구_경계",
    "광주광역시_시군구_경계",
    "대전광역시_시군구_경계",
    "울산광역시_시군구_경계",
    "세종특별자치시_시군구_경계",
    "경기도_시군구_경계",
    "강원도_시군구_경계",
    "충청북도_시군구_경계",
    "충청남도_시군구_경계",
    "전라북도_시군구_경계",
    "전라남도_시군구_경계",
    "경상북도_시군구_경계",
    "경상남도_시군구_경계",
    "제주특별자치도_시군구_경계",
]

def extract_paths_and_polygons(svg_content):
    """Extract all path and polygon elements from SVG"""
    if not svg_content:
        return []
    
    elements = []
    
    # Extract path elements
    path_pattern = r'<path\s+[^>]*id="[^"]*"[^>]*/?>'
    for match in re.finditer(path_pattern, svg_content, re.IGNORECASE | re.DOTALL):
        elements.append(match.group(0))
    
    # Extract polygon elements
    polygon_pattern = r'<polygon\s+[^>]*id="[^"]*"[^>]*/?>'
    for match in re.finditer(polygon_pattern, svg_content, re.IGNORECASE | re.DOTALL):
        elements.append(match.group(0))
    
    return elements

def main():
    print("Combining simplified SVG files from statgarten/maps...")
    print(f"Source directory: {SIMPLE_SVG_DIR}\n")
    
    if not SIMPLE_SVG_DIR.exists():
        print(f"❌ Error: {SIMPLE_SVG_DIR} does not exist!")
        print("Please ensure maps-1.0.1 directory exists with svg/simple folder")
        return
    
    all_elements = []
    
    # 시도 경계는 제외하고 시군구 경계만 사용합니다
    # (시도 경계와 시군구 경계가 겹쳐서 표시되는 문제를 방지하기 위해)
    
    # 시군구 경계 추가 (상세한 지역 구분)
    for region in REGIONS:
        if region == "전국_시도_경계":  # Already processed
            continue
            
        svg_file = SIMPLE_SVG_DIR / f"{region}.svg"
        if not svg_file.exists():
            print(f"  ⚠️  Warning: {region}.svg not found")
            continue
        
        print(f"  Processing {region}.svg...")
        svg_content = svg_file.read_text(encoding='utf-8')
        elements = extract_paths_and_polygons(svg_content)
        all_elements.extend(elements)
        print(f"    Found {len(elements)} path/polygon elements")
    
    print(f"\nTotal elements collected: {len(all_elements)}")
    
    # Get viewBox from first 시군구 경계 file (or use default)
    viewbox = "0 0 800 759"  # Default viewBox (based on actual coordinates)
    # 시군구 경계 파일 중 첫 번째 파일에서 viewBox 가져오기
    for region in REGIONS:
        if region == "전국_시도_경계":
            continue
        svg_file = SIMPLE_SVG_DIR / f"{region}.svg"
        if svg_file.exists():
            content = svg_file.read_text(encoding='utf-8')
            viewbox_match = re.search(r'viewBox="([^"]*)"', content)
            if viewbox_match:
                viewbox = viewbox_match.group(1)
                print(f"  Using viewBox from {region}: {viewbox}")
            break
    
    # Create combined SVG
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny" viewBox="{viewbox}" stroke-linecap="round" stroke-linejoin="round">
<g id="전국_시군구_경계">
'''
    
    for element in all_elements:
        svg_content += f"  {element}\n"
    
    svg_content += '''</g>
</svg>'''
    
    OUTPUT_FILE.write_text(svg_content, encoding='utf-8')
    
    file_size = OUTPUT_FILE.stat().st_size / 1024  # KB
    print(f"\n✓ Combined SVG file created: {OUTPUT_FILE}")
    print(f"  File size: {file_size:.2f} KB")
    print(f"  Total elements: {len(all_elements)}")

if __name__ == "__main__":
    main()



