/**
 * @file    layouts.js
 * @desc    레이아웃 9개 정의 + SVG 아이콘
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @exports layouts, layoutIconGroups, layoutSvgMap
 */

export const layouts = {
  '1-full':     { cols: '1fr',             rows: '1fr',             show: 1 },
  '2-side':     { cols: '1fr 1fr',         rows: '1fr',             show: 2 },
  '2-vert':     { cols: '1fr',             rows: '1fr 1fr',         show: 2 },
  '4-quad':     { cols: '1fr 1fr',         rows: '1fr 1fr',         show: 4 },
  '6-grid':     { cols: '1fr 1fr 1fr',     rows: '1fr 1fr',         show: 6 },
  '9-grid':     { cols: '1fr 1fr 1fr',     rows: '1fr 1fr 1fr',     show: 9 },
  '1+3-right':  { cols: '3fr 1fr',         rows: '1fr 1fr 1fr',     show: 4, span: { 0: 'row' } },
  '1+3-bottom': { cols: '1fr 1fr 1fr',     rows: '3fr 1fr',         show: 4, span: { 0: 'col3' } },
  '3+1-left':   { cols: '1fr 3fr',         rows: '1fr 1fr 1fr',     show: 4, span: { 0: 'row-at-col2' } },
};

export const layoutIconGroups = [
  [
    ['1-full', '1-전체'],
    ['2-side', '2-좌우'],
    ['2-vert', '2-상하'],
    ['4-quad', '4-쿼드'],
    ['6-grid', '6-2×3'],
    ['9-grid', '9-채널'],
  ],
  [
    ['1+3-right', '액티브+우3'],
    ['1+3-bottom', '액티브+하3'],
    ['3+1-left', '좌3+액티브'],
  ],
];

export const layoutSvgMap = {
  '1-full':     '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="18" height="14" rx="1"/></svg>',
  '2-side':     '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="8" height="14" rx="1"/><rect x="11" y="1" width="8" height="14" rx="1"/></svg>',
  '2-vert':     '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="18" height="6" rx="1"/><rect x="1" y="9" width="18" height="6" rx="1"/></svg>',
  '4-quad':     '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="8" height="6" rx="1"/><rect x="11" y="1" width="8" height="6" rx="1"/><rect x="1" y="9" width="8" height="6" rx="1"/><rect x="11" y="9" width="8" height="6" rx="1"/></svg>',
  '6-grid':     '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="5" height="6" rx="1"/><rect x="8" y="1" width="5" height="6" rx="1"/><rect x="15" y="1" width="4" height="6" rx="1"/><rect x="1" y="9" width="5" height="6" rx="1"/><rect x="8" y="9" width="5" height="6" rx="1"/><rect x="15" y="9" width="4" height="6" rx="1"/></svg>',
  '9-grid':     '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="5" height="4" rx=".5"/><rect x="8" y="1" width="5" height="4" rx=".5"/><rect x="15" y="1" width="4" height="4" rx=".5"/><rect x="1" y="6" width="5" height="4" rx=".5"/><rect x="8" y="6" width="5" height="4" rx=".5"/><rect x="15" y="6" width="4" height="4" rx=".5"/><rect x="1" y="11" width="5" height="4" rx=".5"/><rect x="8" y="11" width="5" height="4" rx=".5"/><rect x="15" y="11" width="4" height="4" rx=".5"/></svg>',
  '1+3-right':  '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="13" height="14" rx="1"/><rect x="15" y="1" width="4" height="4" rx=".5"/><rect x="15" y="6" width="4" height="4" rx=".5"/><rect x="15" y="11" width="4" height="4" rx=".5"/></svg>',
  '1+3-bottom': '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="18" height="9" rx="1"/><rect x="1" y="11" width="5" height="4" rx=".5"/><rect x="8" y="11" width="5" height="4" rx=".5"/><rect x="15" y="11" width="4" height="4" rx=".5"/></svg>',
  '3+1-left':   '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="4" height="4" rx=".5"/><rect x="1" y="6" width="4" height="4" rx=".5"/><rect x="1" y="11" width="4" height="4" rx=".5"/><rect x="6" y="1" width="13" height="14" rx="1"/></svg>',
};
