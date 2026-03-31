/**
 * @file    state.js
 * @desc    전역 공유 상태 — 모든 모듈이 import
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 */

export let appConfig = null;
export let currentLayout = '4-quad';
export let clipboardFromId = null;
export let clipboardExpanded = false;
export let editingPanelId = null;

export function setAppConfig(cfg) { appConfig = cfg; }
export function setCurrentLayout(key) { currentLayout = key; }
export function setClipboardFromId(id) { clipboardFromId = id; }
export function setClipboardExpanded(val) { clipboardExpanded = val; }
export function setEditingPanelId(id) { editingPanelId = id; }
