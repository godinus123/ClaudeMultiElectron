/**
 * @file    config.js
 * @desc    config.json 로드 + 상수 정의
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @exports loadConfig, COLORS, defaultPanelDefs
 */

export const COLORS = [
  '#1f6feb', '#3fb950', '#a371f7', '#d29922',
  '#ff7b72', '#39d353', '#58a6ff', '#e3b341', '#e6edf3'
];

export const defaultPanelDefs = [
  { id: 1, name: '프론트봇', color: '#1f6feb' },
  { id: 2, name: '백엔드봇', color: '#3fb950' },
  { id: 3, name: '테스터', color: '#a371f7' },
  { id: 4, name: '문서봇', color: '#d29922' },
  { id: 5, name: '디버그봇', color: '#ff7b72' },
  { id: 6, name: '인프라봇', color: '#39d353' },
  { id: 7, name: '리서치봇', color: '#58a6ff' },
  { id: 8, name: '리뷰봇', color: '#e3b341' },
  { id: 9, name: '기타봇', color: '#e6edf3' },
];

export const defaultConfig = {
  panels: defaultPanelDefs,
  defaultLayout: '4-quad',
  url: 'https://claude.ai',
};

export async function loadConfig() {
  try {
    const res = await fetch('../config.json', { cache: 'no-store' });
    if (!res.ok) return { ...defaultConfig };
    const cfg = await res.json();
    const panels = Array.isArray(cfg.panels) && cfg.panels.length > 0
      ? cfg.panels.map(p => ({ id: p.id, name: p.name || p.nickname || `패널 ${p.id}`, color: p.color }))
      : defaultConfig.panels;
    return {
      panels,
      defaultLayout: typeof cfg.defaultLayout === 'string' ? cfg.defaultLayout : defaultConfig.defaultLayout,
      url: typeof cfg.url === 'string' ? cfg.url : defaultConfig.url,
    };
  } catch {
    return { ...defaultConfig };
  }
}
